import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { OtpCodeComponent } from './otp-code/otp-code.component';
import { FaceRecognitionComponent } from './face-recognition/face-recognition.component';
import { BioMetricsComponent } from './bio-metrics/bio-metrics.component';
import { PassKeyComponent } from './pass-key/pass-key.component';
import { InputOtpModule } from 'primeng/inputotp';
import { FormsModule } from '@angular/forms';
import { AuthComponent } from './auth.component';


@NgModule({
  declarations: [
        BioMetricsComponent,
        FaceRecognitionComponent,
        PassKeyComponent,
        OtpCodeComponent,
        AuthComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InputOtpModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
