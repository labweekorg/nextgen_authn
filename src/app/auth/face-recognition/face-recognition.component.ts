import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { WebAuthnService } from '../../service/webauthn.service';
import { Router } from '@angular/router';
import { AuthStateService } from 'src/app/service/authState.service';

@Component({
  selector: 'app-face-recognition',
  templateUrl: './face-recognition.component.html',
  styleUrls: ['./face-recognition.component.css'],
  standalone: false,
})
export class FaceRecognitionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  scanning: boolean = false;
  success: boolean = false;
  error: string = '';
  statusMessage: string = 'Initializing camera...';
  cameraReady: boolean = false;

  private stream: MediaStream | null = null;
  private faceDetectionInterval: any;
userName: string = '';
  constructor(
    private webAuthnService: WebAuthnService,
    private router: Router,
    public authState: AuthStateService,
  ) {
    this.userName = this.authState.getUser();
  }

  ngOnInit(): void {
    console.log('FaceRecognitionComponent initialized');
  }

  ngAfterViewInit(): void {
    // Initialize camera after view is ready
    this.initializeCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.faceDetectionInterval) {
      clearInterval(this.faceDetectionInterval);
    }
  }

  async initializeCamera() {
    try {
      console.log('Requesting camera access...');

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      console.log('Camera access granted', this.stream);
      this.cameraReady = true;

      // Wait for video element to be available and set the stream
      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;

          // Ensure video plays
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            video
              .play()
              .then(() => {
                console.log('Video playing');
                this.statusMessage = 'Position your face in the frame';

                // Start face detection after video is playing
                setTimeout(() => {
                  this.startFaceRecognition();
                }, 500);
              })
              .catch((err) => {
                console.error('Error playing video:', err);
              });
          };
        } else {
          console.error('Video element not found');
        }
      }, 200);
    } catch (err: any) {
      console.error('Camera access error:', err);
      this.error = 'Unable to access camera';
      this.statusMessage = 'Please allow camera access to continue';
    }
  }

  async startFaceRecognition() {
    try {
      this.scanning = true;
      this.statusMessage = 'Scanning face...';

      // Simulate face detection delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if platform authenticator is available for secure storage
      const isAvailable = await this.webAuthnService.isPlatformAuthenticatorAvailable();

      if (!isAvailable) {
        throw new Error('Secure enclave not available on this device');
      }

      console.log('Registering face biometric with secure enclave...');

      // Use WebAuthn to store face authentication in Secure Enclave
      const userId = 'user-face-' + Date.now();
      const username = this.userName;

      const result = await this.webAuthnService.registerFaceRecognition(userId, username);

      // const result = await this.webAuthnService.authenticateFaceRecognition(username);
      if (result.verified) {
        this.success = true;
        this.scanning = false;
        this.statusMessage = 'Face verified successfully!';

        // Stop camera
        this.stopCamera();

        // Redirect to Workday
        setTimeout(() => {
          console.log('Face authentication successful', result);
          window.open('/assets/success.html', '_blank');
        }, 1500);
      } else {
        throw new Error(result.message || 'Face verification failed');
      }
    } catch (err: any) {
      console.error('Face recognition error:', err);
      this.error = err.message || 'Failed to verify face';
      this.statusMessage = 'Face verification failed. Please try again.';
      this.scanning = false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  retry() {
    this.error = '';
    this.success = false;
    this.scanning = false;
    this.initializeCamera();
  }
}
