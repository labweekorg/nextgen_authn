import { Component } from "@angular/core";
import { Form, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { first } from "rxjs";
import { WebAuthnService } from "../service/webauthn.service";

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.css'],
    standalone: false
})
export class SignUpComponent {

    employeeForm:FormGroup;
    otp:string = '';
    verificationMethod:string = ''
    passKeyValue:string = '';
    status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
    message: string = '';
    isRegistered: boolean = false;

     constructor(public fb:FormBuilder,private webauthn: WebAuthnService) {
        this.employeeForm = this.fb.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', [
                Validators.required,
                Validators.pattern(/^[0-9]{10}$/), // 10 digit number
                Validators.minLength(10),
                Validators.maxLength(10)
            ]]
        });
     }

     // Helper method to check if field is invalid and touched
     isFieldInvalid(fieldName: string): boolean {
        const field = this.employeeForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
     }

     // Helper method to get specific error message
     getErrorMessage(fieldName: string): string {
        const field = this.employeeForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) {
                return `${fieldName} is required`;
            }
            if (field.errors['email']) {
                return 'Please enter a valid email address';
            }
            if (field.errors['pattern']) {
                if (fieldName === 'phoneNumber') {
                    return 'Please enter a valid 10-digit mobile number';
                }
            }
            if (field.errors['minlength'] || field.errors['maxlength']) {
                if (fieldName === 'phoneNumber') {
                    return 'Mobile number must be exactly 10 digits';
                }
            }
        }
        return '';
     }

     // Submit handler
     onSubmit() {
        if (this.employeeForm.valid) {
            console.log('Form Data:', this.employeeForm.value);
            // Handle form submission
        } else {
            // Mark all fields as touched to show errors
            Object.keys(this.employeeForm.controls).forEach(key => {
                this.employeeForm.get(key)?.markAsTouched();
            });
        }
     }
     selectVerification(method:string){
        this.verificationMethod = method;
     }

    async register(){
        this.status = 'loading';
    this.message = '👆 Follow your device prompt to scan your fingerprint...';
    try {
      await this.webauthn.registerBiometric('user-123', "Boobalan");
      localStorage.setItem('webauthn_registered', 'true');
      this.isRegistered = true;
      this.status = 'success';
      this.message = '✅ Fingerprint registered in secure hardware!';
    } catch (e: any) {
      this.status = 'error';
      this.message = `❌ Registration failed: ${e.message}`;
    }
     }
 }