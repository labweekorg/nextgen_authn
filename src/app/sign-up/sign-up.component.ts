import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WebAuthnService } from '../service/webauthn.service';
import { AuthStateService } from '../service/authState.service';

type RegistrationMethod = 'fingerprint' | 'faceId' | 'passkey';
type RegistrationStatus = 'idle' | 'loading' | 'success' | 'error';

interface RegistrationState {
  status: RegistrationStatus;
  message: string;
  isRegistered: boolean;
}

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
  standalone: false,
})
export class SignUpComponent implements OnDestroy {
  employeeForm: FormGroup;
  otp: string = '';
  verificationMethod: string = '';
  faceScanning = false;
  faceCameraReady = false;
  passKeyValue = '';
  private faceStream: MediaStream | null = null;
  registrationState: Record<RegistrationMethod, RegistrationState> = {
    fingerprint: {
      status: 'idle',
      message: 'Tap the fingerprint sensor above to register your fingerprint.',
      isRegistered: false,
    },
    faceId: {
      status: 'idle',
      message: 'Click "Register Face ID" to open your camera and scan your face.',
      isRegistered: false,
    },
    passkey: {
      status: 'idle',
      message: 'Enter a 6-digit PIN you will remember. You will use this to authenticate later.',
      isRegistered: false,
    },
  };

  constructor(
    public fb: FormBuilder,
    private webAuthnService: WebAuthnService,
    public authState: AuthStateService
  ) {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/), // 10 digit number
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
    });
    this.getUserDetails();
  }

  getUserDetails() {
  this.employeeForm.patchValue({
    email: this.authState.getUser()?.email || ''
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
      Object.keys(this.employeeForm.controls).forEach((key) => {
        this.employeeForm.get(key)?.markAsTouched();
      });
    }
  }
  selectVerification(method: string) {
    this.verificationMethod = method;
  }

  getState(method: RegistrationMethod): RegistrationState {
    return this.registrationState[method];
  }

  async registerFingerprint() {
    await this.registerMethod('fingerprint');
  }

  activateFaceStep(activateCallback: (step: number) => void) {
    activateCallback(2);
    // Wait for the ng-template to be instantiated in the DOM before starting the camera
    setTimeout(() => {
      const videoEl = document.querySelector('video.video-feed') as HTMLVideoElement;
      if (videoEl) {
        this.startFaceRegistration(videoEl);
      }
    }, 200);
  }

  retryFaceRegistration() {
    this.registrationState['faceId'].status = 'idle';
    setTimeout(() => {
      const videoEl = document.querySelector('video.video-feed') as HTMLVideoElement;
      if (videoEl) {
        this.startFaceRegistration(videoEl);
      }
    }, 50);
  }

  async startFaceRegistration(videoEl: HTMLVideoElement) {
    const state = this.registrationState['faceId'];
    if (state.status === 'loading' || state.status === 'success') return;

    state.status = 'loading';
    state.message = 'Opening camera…';
    this.faceScanning = false;
    this.faceCameraReady = false;

    try {
      this.faceStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      // Assign stream before making the video visible so the feed is ready when it appears
      videoEl.srcObject = this.faceStream;
      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => videoEl.play().then(resolve).catch(reject);
      });

      this.faceCameraReady = true;
      state.message = 'Position your face in the frame…';

      // Give the user a moment to centre their face
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.faceScanning = true;
      state.message = 'Scanning your face…';
      await new Promise((resolve) => setTimeout(resolve, 2000));
      this.faceScanning = false;

      state.message = 'Registering with secure system…';
      const userId = `faceId-user-${Date.now()}`;
      const username = this.employeeForm.get('email')?.value || 'demo-faceId-user';

      const result = await this.webAuthnService.registerFaceId(userId, username);

      if (result.verified) {
        state.status = 'success';
        state.isRegistered = true;
        state.message = 'Face ID registration completed.';
      } else {
        state.status = 'error';
        state.isRegistered = false;
        state.message = result.message || 'Face ID registration failed. Try again.';
      }
    } catch (err: any) {
      console.error('Face ID registration error:', err);
      state.status = 'error';
      state.isRegistered = false;
      this.faceScanning = false;

      if (err.name === 'NotAllowedError' && !this.faceCameraReady) {
        state.message = 'Camera access denied. Please allow camera access and try again.';
      } else if (err.name === 'NotAllowedError') {
        state.message = 'Face ID registration was cancelled or denied.';
      } else if (err.status === 0 || err.message?.includes('Http failure')) {
        state.message =
          'Cannot connect to authentication server. Please ensure the backend server is running at http://localhost:8080';
      } else {
        state.message = err.message || 'Face ID registration failed. Try again.';
      }
    } finally {
      this.stopFaceCamera();
    }
  }

  ngOnDestroy() {
    this.stopFaceCamera();
  }

  private stopFaceCamera() {
    if (this.faceStream) {
      this.faceStream.getTracks().forEach((track) => track.stop());
      this.faceStream = null;
    }
    this.faceCameraReady = false;
    this.faceScanning = false;
  }

  async submitPasskey() {
    const state = this.registrationState['passkey'];
    if (!this.passKeyValue || this.passKeyValue.length !== 6) return;

    state.status = 'loading';
    state.message = 'Saving your passkey…';

    const username = this.employeeForm.get('email')?.value || 'demo-passkey-user';

    try {
      const result = await this.webAuthnService.registerPasskey(this.passKeyValue, username);
      console.log('Passkey PIN registration result:', result);

      if (result.verified) {
        state.status = 'success';
        state.isRegistered = true;
        state.message = 'Passkey registered successfully.';
        this.passKeyValue = '';
      } else {
        state.status = 'error';
        state.isRegistered = false;
        state.message = result.message || 'Passkey could not be saved. Try again.';
        this.passKeyValue = '';
      }
    } catch (err: any) {
      console.error('Passkey PIN registration error:', err);
      state.status = 'error';
      state.isRegistered = false;
      this.passKeyValue = '';

      if (err.status === 0 || err.message?.includes('Http failure')) {
        state.message =
          'Cannot connect to authentication server. Please ensure the backend server is running at http://localhost:8080';
      } else {
        state.message = err.message || 'Passkey could not be saved. Try again.';
      }
    }
  }

  private async registerMethod(method: RegistrationMethod) {
    const state = this.registrationState[method];
    state.status = 'loading';
    state.message = this.getLoadingMessage(method);

    const userId = `${method}-user-${Date.now()}`;
    const username = this.employeeForm.get('email')?.value || `demo-${method}-user`;

    try {
      const result = await this.callRegistration(method, userId, username);
      console.log(`${method} registration result:`, result);

      if (result.verified) {
        state.status = 'success';
        state.isRegistered = true;
        state.message = this.getSuccessMessage(method);
      } else {
        state.status = 'error';
        state.isRegistered = false;
        state.message = result.message || this.getFailureMessage(method);
      }
    } catch (err: any) {
      console.error(`${method} registration error:`, err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', JSON.stringify(err, null, 2));

      if (err.name === 'NotAllowedError') {
        state.status = 'error';
        state.isRegistered = false;
        state.message = this.getCancelledMessage(method);
      } else if (err.status === 0 || err.message?.includes('Http failure')) {
        state.status = 'error';
        state.isRegistered = false;
        state.message =
          'Cannot connect to authentication server. Please ensure the backend server is running at http://localhost:8080';
      } else {
        state.status = 'error';
        state.isRegistered = false;
        state.message = err.message || this.getFailureMessage(method);
      }
    }
  }

  private callRegistration(method: RegistrationMethod, userId: string, username: string) {
    if (method === 'faceId') {
      return this.webAuthnService.registerFaceId(userId, username);
    }

    // passkey is handled by submitPasskey() — not reached via registerMethod
    return this.webAuthnService.registerFingerprint(userId, username);
  }

  private getLoadingMessage(method: RegistrationMethod): string {
    if (method === 'faceId') {
      return 'Authenticator dialog open — choose "Use a phone or tablet" for Face ID, or approve on this device.';
    }

    if (method === 'passkey') {
      return 'Passkey dialog open — choose where to save your passkey (iCloud Keychain, nearby device, security key).';
    }

    return 'Fingerprint prompt open — touch the sensor on your device.';
  }

  private getSuccessMessage(method: RegistrationMethod): string {
    if (method === 'faceId') {
      return 'Face ID registration completed.';
    }

    if (method === 'passkey') {
      return 'Passkey registration completed.';
    }

    return 'Fingerprint registration completed.';
  }

  private getFailureMessage(method: RegistrationMethod): string {
    if (method === 'faceId') {
      return 'Face ID registration failed. Try again.';
    }

    if (method === 'passkey') {
      return 'Passkey registration failed. Try again.';
    }

    return 'Fingerprint registration failed. Try again.';
  }

  private getCancelledMessage(method: RegistrationMethod): string {
    if (method === 'faceId') {
      return 'Face ID registration was cancelled or denied.';
    }

    if (method === 'passkey') {
      return 'Passkey registration was cancelled or denied.';
    }

    return 'Fingerprint registration was cancelled or denied.';
  }
}
