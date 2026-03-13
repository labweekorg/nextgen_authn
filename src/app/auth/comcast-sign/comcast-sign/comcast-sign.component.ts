import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-comcast-sign',
  standalone: false,
  templateUrl: './comcast-sign.component.html',
  styleUrls: ['./comcast-sign.component.css']
})
export class ComcastSignComponent {

  isLoginScreen: boolean = true;
  isPasswordScreen: boolean = false;
  emailId: string = '';
  emailForm: FormGroup;
  passwordForm: FormGroup;

  constructor(private fb: FormBuilder,public router: Router) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  handleNext() {
    if (this.emailForm.valid) {
      this.emailId = this.emailForm.get('email')?.value;
      this.isLoginScreen = false;
      this.isPasswordScreen = true;
    } else {
      this.emailForm.markAllAsTouched();
    }
  }
  goBack(){
    this.isLoginScreen = true;
    this.isPasswordScreen = false;
  }

  handleSignIn() {
this.router.navigate(['/signup'])
  }
}
