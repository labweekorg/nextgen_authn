import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OtpCodeComponent } from './auth/otp-code/otp-code.component';
import { InputOtpModule } from 'primeng/inputotp';
import { FormsModule } from '@angular/forms';
import { SignUpModule } from './sign-up/sign-up.module';
import { StepperModule } from 'primeng/stepper';
import { definePreset } from '@primeng/themes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '#1a7ad4',
      900: '#1a7ad4',
      950: '{sky.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{sky.800}',
          inverseColor: '#ffffff',
          hoverColor: '{sky.900}',
          activeColor: '{sky.800}',
        },
        highlight: {
          background: '{sky.950}',
          focusBackground: '{sky.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{sky.50}',
          inverseColor: '{sky.950}',
          hoverColor: '{sky.100}',
          activeColor: '{sky.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
});
  
  @NgModule({
    declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    StepperModule,
    InputOtpModule,
    SignUpModule
  ],
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideAnimationsAsync(),
    providePrimeNG({
      theme: {
       preset: MyPreset
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }