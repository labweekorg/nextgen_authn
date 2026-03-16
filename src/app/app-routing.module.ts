import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BioMetricsComponent } from './auth/bio-metrics/bio-metrics.component';
import { PassKeyComponent } from './auth/pass-key/pass-key.component';
import { OtpCodeComponent } from './auth/otp-code/otp-code.component';
import { FaceRecognitionComponent } from './auth/face-recognition/face-recognition.component';

const routes: Routes = [
 {
    path: '',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'signup',
    loadChildren: () => import('./sign-up/sign-up.module').then((m) => m.SignUpModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{enableViewTransitions: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {}
