import { BrowserModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CookieService } from 'ngx-cookie-service';
import { AppComponent } from './app.component';
import { EtaPipe, SpeedPipe, EncodeURIComponent, FileSizePipe } from './downloads.pipe';
import { MasterCheckboxComponent, SlaveCheckboxComponent } from './master-checkbox.component';
import { MeTubeSocket } from './metube-socket';
import { NgSelectModule } from '@ng-select/ng-select';
import { ServiceWorkerModule } from '@angular/service-worker';

// Ajoutez ces imports
import { AuthService } from './auth.service';
import { AuthInterceptor } from './auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    EtaPipe,
    SpeedPipe,
    FileSizePipe,
    EncodeURIComponent,
    MasterCheckboxComponent,
    SlaveCheckboxComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule,
    HttpClientModule,
    FontAwesomeModule,
    NgSelectModule,
    ServiceWorkerModule.register('custom-service-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    CookieService, 
    MeTubeSocket,
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
