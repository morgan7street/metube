import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { faTrashAlt, faCheckCircle, faTimesCircle, IconDefinition } from '@fortawesome/free-regular-svg-icons';
import { faRedoAlt, faSun, faMoon, faCircleHalfStroke, faCheck, faExternalLinkAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import { CookieService } from 'ngx-cookie-service';
import { map, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Download, DownloadsService, Status } from './downloads.service';
import { MasterCheckboxComponent } from './master-checkbox.component';
import { Formats, Format, Quality } from './formats';
import { Theme, Themes } from './theme';
import { KeyValue } from "@angular/common";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit, AfterViewInit {
  addUrl: string;
  formats: Format[] = Formats;
  qualities: Quality[];
  quality: string;
  format: string;
  folder: string;
  customNamePrefix: string;
  autoStart: boolean;
  addInProgress = false;
  themes: Theme[] = Themes;
  activeTheme: Theme;
  customDirs$: Observable<string[]>;

  @ViewChild('queueMasterCheckbox') queueMasterCheckbox: MasterCheckboxComponent;
  @ViewChild('queueDelSelected') queueDelSelected: ElementRef;
  @ViewChild('doneMasterCheckbox') doneMasterCheckbox: MasterCheckboxComponent;
  @ViewChild('doneDelSelected') doneDelSelected: ElementRef;
  @ViewChild('doneClearCompleted') doneClearCompleted: ElementRef;
  @ViewChild('doneClearFailed') doneClearFailed: ElementRef;
  @ViewChild('doneRetryFailed') doneRetryFailed: ElementRef;

  faTrashAlt = faTrashAlt;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faRedoAlt = faRedoAlt;
  faSun = faSun;
  faMoon = faMoon;
  faCheck = faCheck;
  faCircleHalfStroke = faCircleHalfStroke;
  faDownload = faDownload;
  faExternalLinkAlt = faExternalLinkAlt;

  constructor(
    public downloads: DownloadsService, 
    private cookieService: CookieService,
    private authService: AuthService,
    private router: Router
  ) {
    this.format = cookieService.get('metube_format') || 'any';
    this.setQualities();
    this.quality = cookieService.get('metube_quality') || 'best';
    this.autoStart = cookieService.get('metube_auto_start') !== 'false';
    this.activeTheme = this.getPreferredTheme(cookieService);
  }

  ngOnInit() {
    this.handleAuthentication();
    this.initializeApp();
  }

  ngAfterViewInit() {
    this.downloads.queueChanged.subscribe(() => {
      this.queueMasterCheckbox.selectionChanged();
    });
    this.downloads.doneChanged.subscribe(() => {
      this.doneMasterCheckbox.selectionChanged();
      let completed: number = 0, failed: number = 0;
      this.downloads.done.forEach(dl => {
        if (dl.status === 'finished')
          completed++;
        else if (dl.status === 'error')
          failed++;
      });
      this.doneClearCompleted.nativeElement.disabled = completed === 0;
      this.doneClearFailed.nativeElement.disabled = failed === 0;
      this.doneRetryFailed.nativeElement.disabled = failed === 0;
    });
  }

  private handleAuthentication() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.authService.login(token);
      // Nettoyer l'URL après avoir récupéré le token
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (!this.authService.isLoggedIn()) {
      this.redirectToLogin();
    }
  }

  private redirectToLogin() {
    window.location.href = 'https://authentygoogle.onrender.com/auth/google';
  }

  private initializeApp() {
    // Initialisation de l'application seulement si l'utilisateur est authentifié
    if (this.authService.isLoggedIn()) {
      this.customDirs$ = this.getMatchingCustomDir();
      this.setTheme(this.activeTheme);

      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.activeTheme.id === 'auto') {
           this.setTheme(this.activeTheme);
        }
      });
    }
  }

  asIsOrder(a, b) {
    return 1;
  }

  qualityChanged() {
    this.cookieService.set('metube_quality', this.quality, { expires: 3650 });
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  showAdvanced() {
    return this.downloads.configuration['CUSTOM_DIRS'];
  }

  allowCustomDir(tag: string) {
    if (this.downloads.configuration['CREATE_CUSTOM_DIRS']) {
      return tag;
    }
    return false;
  }

  isAudioType() {
    return this.quality == 'audio' || this.format == 'mp3'  || this.format == 'm4a' || this.format == 'opus' || this.format == 'wav' || this.format == 'flac';
  }

  getMatchingCustomDir(): Observable<string[]> {
    return this.downloads.customDirsChanged.asObservable().pipe(map((output) => {
      if (this.isAudioType()) {
        console.debug("Showing audio-specific download directories");
        return output["audio_download_dir"];
      } else {
        console.debug("Showing default download directories");
        return output["download_dir"];
      }
    }));
  }

  getPreferredTheme(cookieService: CookieService) {
    let theme = 'auto';
    if (cookieService.check('metube_theme')) {
      theme = cookieService.get('metube_theme');
    }
    return this.themes.find(x => x.id === theme) ?? this.themes.find(x => x.id === 'auto');
  }

  themeChanged(theme: Theme) {
    this.cookieService.set('metube_theme', theme.id, { expires: 3650 });
    this.setTheme(theme);
  }

  setTheme(theme: Theme) {
    this.activeTheme = theme;
    if (theme.id === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme.id);
    }
  }

  formatChanged() {
    this.cookieService.set('metube_format', this.format, { expires: 3650 });
    this.setQualities();
    this.downloads.customDirsChanged.next(this.downloads.customDirs);
  }

  autoStartChanged() {
    this.cookieService.set('metube_auto_start', this.autoStart ? 'true' : 'false', { expires: 3650 });
  }

  queueSelectionChanged(checked: number) {
    this.queueDelSelected.nativeElement.disabled = checked == 0;
  }

  doneSelectionChanged(checked: number) {
    this.doneDelSelected.nativeElement.disabled = checked == 0;
  }

  setQualities() {
    this.qualities = this.formats.find(el => el.id == this.format).qualities;
    const exists = this.qualities.find(el => el.id === this.quality);
    this.quality = exists ? this.quality : 'best';
  }

  addDownload(url?: string, quality?: string, format?: string, folder?: string, customNamePrefix?: string, autoStart?: boolean) {
    url = url ?? this.addUrl;
    quality = quality ?? this.quality;
    format = format ?? this.format;
    folder = folder ?? this.folder;
    customNamePrefix = customNamePrefix ?? this.customNamePrefix;
    autoStart = autoStart ?? this.autoStart;

    console.debug('Downloading: url='+url+' quality='+quality+' format='+format+' folder='+folder+' customNamePrefix='+customNamePrefix+' autoStart='+autoStart);
    this.addInProgress = true;
    this.downloads.add(url, quality, format, folder, customNamePrefix, autoStart).subscribe({
      next: (status: Status) => {
        if (status.status === 'error') {
          alert(`Error adding URL: ${status.msg}`);
        } else {
          this.addUrl = '';
        }
        this.addInProgress = false;
      },
      error: (error) => {
        if (error.status === 401) {
          console.error('Authentication error', error);
          this.redirectToLogin();
        } else {
          console.error('Error adding download', error);
          alert('Error adding URL: ' + error.message);
        }
        this.addInProgress = false;
      }
    });
  }

  retryDownload(key: string, download: Download) {
    this.downloads.delById('done', [key]).subscribe({
      next: () => {
        this.addDownload(download.url, download.quality, download.format, download.folder, download.custom_name_prefix, true);
      }
    });
  }

  masterQueueToggleChange(masterCheckbox: MasterCheckboxComponent) {
    const checkboxes = document.querySelectorAll('.queue-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = masterCheckbox.checked;
    });
  }

  masterDoneToggleChange(masterCheckbox: MasterCheckboxComponent) {
    const checkboxes = document.querySelectorAll('.done-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((checkbox) => {
      checkbox.checked = masterCheckbox.checked;
    });
  }

  deleteQueue() {
    const checkboxes = document.querySelectorAll('.queue-checkbox') as NodeListOf<HTMLInputElement>;
    const checkedKeys: string[] = Array.from(checkboxes).filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
    this.downloads.delById('queue', checkedKeys).subscribe();
  }

  deleteDone() {
    const checkboxes = document.querySelectorAll('.done-checkbox') as NodeListOf<HTMLInputElement>;
    const checkedKeys: string[] = Array.from(checkboxes).filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
    this.downloads.delById('done', checkedKeys).subscribe();
  }

  deleteAllDone() {
    this.downloads.delAllByStatus('finished').subscribe();
  }

  clearFailedDownloads() {
    const failedKeys: string[] = Array.from(this.downloads.done.values()).filter(download => download.status === 'error').map(download => download.id);
    this.downloads.delById('done', failedKeys).subscribe();
  }

  retryFailedDownloads() {
    const failedDownloads: Download[] = Array.from(this.downloads.done.values()).filter(download => download.status === 'error');
    failedDownloads.forEach(download => this.retryDownload(download.id, download));
  }

  identifyDownloadRow(index: number, download: KeyValue<string, Download>): string {
    return download.key;
  }

  logout() {
    this.authService.logout();
    this.redirectToLogin();
  }
}
