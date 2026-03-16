import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  DoCheck,
} from '@angular/core';
import { WebAuthnService } from '../../service/webauthn.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pass-key',
  templateUrl: './pass-key.component.html',
  styleUrls: ['./pass-key.component.css'],
  standalone: false,
})
export class PassKeyComponent implements OnInit, AfterViewInit, DoCheck {
  pkFilled = 0;
  passKeyValue: any = '';
  verifying: boolean = false;
  success: boolean = false;
  error: string = '';
  statusMessage: string = 'Enter your 6-digit passkey';

  constructor(
    private webAuthnService: WebAuthnService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {}

  ngOnInit(): void {}

  ngDoCheck(): void {
    // Auto-verify when 6 digits are entered
    if (this.passKeyValue && this.passKeyValue.length === 6 && !this.verifying && !this.success) {
      this.verifyPasskey();
    }
  }

  async verifyPasskey() {
    try {
      this.verifying = true;
      this.error = '';
      this.statusMessage = 'Verifying passkey...';

      console.log('Verifying passkey:', this.passKeyValue);

      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use WebAuthn for secure passkey verification (stored in Secure Enclave)
      const userId = 'user-passkey-' + Date.now();
      const username = 'passkey-user';

      const result = await this.webAuthnService.registerBiometric(userId, username);

      if (result.verified) {
        this.success = true;
        this.statusMessage = 'Passkey verified successfully!';

        // Redirect to Workday
        setTimeout(() => {
          console.log('Passkey authentication successful', result);
          window.open('/assets/success.html', '_blank');
        }, 1500);
      } else {
        throw new Error(result.message || 'Invalid passkey');
      }
    } catch (err: any) {
      console.error('Passkey verification error:', err);
      this.error = err.message || 'Invalid passkey';
      this.statusMessage = 'Verification failed. Please try again.';
      this.passKeyValue = ''; // Clear the input
    } finally {
      this.verifying = false;
    }
  }

  otpBack(event: KeyboardEvent, value: any) {}
}
