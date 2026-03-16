import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BioMetricsComponent } from './bio-metrics/bio-metrics.component';
import { PassKeyComponent } from './pass-key/pass-key.component';
import { OtpCodeComponent } from './otp-code/otp-code.component';
import { FaceRecognitionComponent } from './face-recognition/face-recognition.component';
import { AuthComponent } from './auth.component';
import { ComcastSignComponent } from './comcast-sign/comcast-sign/comcast-sign.component';

const routes: Routes = [
  {
    path: '',
    component: ComcastSignComponent,
  },
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      {
        path: 'bio',
        component: BioMetricsComponent,
      },
      {
        path: 'pass',
        component: PassKeyComponent,
      },
      {
        path: 'otp',
        component: OtpCodeComponent,
      },
      {
        path: 'face',
        component: FaceRecognitionComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
