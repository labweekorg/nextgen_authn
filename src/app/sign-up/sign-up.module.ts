import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SignUpRoutingModule } from './sign-up-routing.module';
import { SignUpComponent } from './sign-up.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputOtpModule } from 'primeng/inputotp';
import { RadioButtonModule } from 'primeng/radiobutton';
import { WebAuthnService } from '../service/webauthn.service';
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  declarations: [SignUpComponent],
  imports: [
    CommonModule,
    StepperModule,
    HttpClientModule,
    SignUpRoutingModule,
    ButtonModule,
    ReactiveFormsModule,
    FormsModule,
    InputOtpModule,
    InputTextModule,
    FloatLabelModule,
    RadioButtonModule,
    InputOtpModule
  ],
  providers: [WebAuthnService]
})
export class SignUpModule { }
