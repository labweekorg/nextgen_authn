import { Component, OnInit } from '@angular/core';
import { WebAuthnService } from '../../service/webauthn.service';
import { Router } from '@angular/router';
import { AuthStateService } from 'src/app/service/authState.service';

@Component({
  selector: 'app-bio-metrics',
  templateUrl: './bio-metrics.component.html',
  styleUrls: ['./bio-metrics.component.css'],
  standalone: false,
})
export class BioMetricsComponent implements OnInit {
  scanning: boolean = false;
  success: boolean = false;
  error: string = '';
  statusMessage: string = 'Touch the fingerprint sensor on your device';
  userName: string = '';

  constructor(private webAuthnService: WebAuthnService, public authState: AuthStateService,public router: Router) {
    this.userName = this.authState.getUser()?.email;
    
    
  }

  async ngOnInit(): Promise<void> {
    // Check if platform authenticator is available
    try {
      console.log('Checking platform authenticator availability...');
      const isAvailable = await this.webAuthnService.isPlatformAuthenticatorAvailable();
      console.log('Platform authenticator available:', isAvailable);

      if (!isAvailable) {
        this.error = 'Touch ID/Fingerprint sensor is not available on this device';
        this.statusMessage = 'Please enable Touch ID or use another authentication method';
        return;
      }

      // Automatically start the fingerprint scan
      this.statusMessage = 'Initializing scan...';
      await this.startBiometricScan();
    } catch (err: any) {
      console.error('Platform check error:', err);
      this.error = 'Unable to check device capabilities';
      this.statusMessage = 'Please try another authentication method';
    }
  }

  async startBiometricScan() {
    console.log('Starting biometric scan...');
    try {
      this.scanning = true;
      this.error = '';
      this.success = false;
      this.statusMessage = 'Place your finger on the sensor...';

      // Get user info (you may want to get this from a service or route params)
      const userId = 'user-' + Date.now();
      const username = `fingerprint-${this.userName}`;
      const displayName = `fingerprint-${this.userName}`;
      const user = await this.webAuthnService.getRegistrationOptions({ username, displayName });

      console.log('Calling registerBiometric with:', user);

      const result = await this.webAuthnService.authenticateBiometric(username);
      console.log('registerBiometric result:', result.message);

      if (result.verified) {
        this.success = true;
        this.statusMessage = 'Fingerprint verified successfully!';

        // Redirect to success page in a new tab after successful verification
        setTimeout(() => {
          console.log('Authentication successful', result);
          this.router.navigate(['/success']);
        }, 1500);
      } else {
        this.error = result.message || 'Verification failed';
        this.statusMessage = 'Verification failed. Please try again.';
      }
    } catch (err: any) {
      console.error('Biometric scan error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', JSON.stringify(err, null, 2));

      // Handle specific error cases
      if (err.name === 'NotAllowedError') {
        this.error = 'Permission denied or cancelled';
        this.statusMessage =
          'You cancelled the biometric prompt. Click "Scan Fingerprint" to try again.';
      } else if (err.message && err.message.includes('Touch ID')) {
        this.error = err.message;
        this.statusMessage = 'Please enable Touch ID in System Settings';
      } else if (err.status === 0 || err.message?.includes('Http failure')) {
        this.error = 'Cannot connect to authentication server';
        this.statusMessage = 'Please ensure the backend server is running at http://localhost:8080';
      } else {
        this.error = err.message || 'Failed to scan fingerprint';
        this.statusMessage = 'An error occurred. Click "Scan Fingerprint" to try again.';
      }
    } finally {
      this.scanning = false;
      console.log('Biometric scan completed. Success:', this.success, 'Error:', this.error);
    }
  }

  retry() {
    this.error = '';
    this.success = false;
    this.statusMessage = 'Ready to scan. Click the button below to start.';
  }

  scanFingerprint() {
    console.log('scanFingerprint() called');
    console.log(
      'Current state - scanning:',
      this.scanning,
      'success:',
      this.success,
      'error:',
      this.error
    );
    this.startBiometricScan();
  }
}
