import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import { firstValueFrom, map } from 'rxjs';

export interface RegisterStartResponse {
  options: any;
  sessionId: string;
}

export interface AuthStartResponse {
  options: PublicKeyCredentialRequestOptionsJSON;
  sessionId: string;
}

export interface VerifyResponse {
  verified: boolean;
  token?: string;
  message?: string;
}

export interface RegistrationVerifyRequest {
  id: string; // credential ID (Base64URL)
  rawId: string; // raw credential ID (Base64URL)
  type: string; // always "public-key"
  username: string; // which user is registering
  response: {
    // contains clientDataJSON, attestationObject
    clientDataJSON: string;
    attestationObject: string;
    [key: string]: any;
  };
}

export interface LoginVerifyRequest {
  id: string; // credential ID (Base64URL)
  rawId: string; // raw credential ID (Base64URL)
  type: string; // always "public-key"
  username: string; // which user is authenticating
  response: {
    // contains clientDataJSON, authenticatorData, signature, userHandle
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
    [key: string]: any;
  };
}

type PlatformRegistrationMode = 'fingerprint' | 'faceId' | 'passkey';

@Injectable({ providedIn: 'root' })
export class WebAuthnService {
  private readonly api = 'http://localhost:8080/webauthn';
  private readonly DEMO_MODE = false; // Set to false when backend is ready

  constructor(private http: HttpClient) {}

  async isSupported(): Promise<boolean> {
    return browserSupportsWebAuthn();
  }

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    return platformAuthenticatorIsAvailable();
  }

  async getRegistrationOptions(request: any): Promise<{ options: any; sessionId?: string }> {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.api}/register/options`, request)
    );

    // If response has sessionId, extract it; otherwise return the entire response as options
    if (response.sessionId) {
      return { options: response, sessionId: response.sessionId };
    }

    // Response itself is the options object
    return { options: response, sessionId: undefined };
  }

  async getVerifyRegistration(request: RegistrationVerifyRequest): Promise<VerifyResponse> {
    return firstValueFrom(this.http.post<VerifyResponse>(`${this.api}/register/verify`, request));
  }

  // Authentication (Login) Methods
  async getLoginOptions(request: any): Promise<{ options: any; sessionId?: string }> {
    const response = await firstValueFrom(
      this.http.post<any>(`${this.api}/login/options`, request)
    );

    // If response has sessionId, extract it; otherwise return the entire response as options
    if (response.sessionId) {
      return { options: response, sessionId: response.sessionId };
    }

    // Response itself is the options object
    return { options: response, sessionId: undefined };
  }

  async getVerifyLogin(request: LoginVerifyRequest): Promise<VerifyResponse> {
    return firstValueFrom(this.http.post<VerifyResponse>(`${this.api}/login/verify`, request));
  }

  async authenticateBiometric(username: string): Promise<VerifyResponse> {
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('Platform authenticator available:', platformAvailable);

    if (!platformAvailable) {
      throw new Error('Touch ID is not available. Ensure Touch ID is enabled in System Settings.');
    }

    // Step 1 — get challenge + options from backend
    const { options, sessionId } = await this.getLoginOptions({ username });

    console.log('Login options from server:', options);
    console.log('Session ID:', sessionId);

    // Ensure allowCredentials have platform transports
    if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
      options.allowCredentials = options.allowCredentials.map((cred: any) => ({
        ...cred,
        transports: ['internal'], // Force platform authenticator (Touch ID/Face ID)
      }));
    }

    console.log('Modified login options:', options);

    // Step 2 — browser prompts for biometric authentication
    console.log('About to call startAuthentication...');

    let assertion;
    try {
      assertion = await startAuthentication({ optionsJSON: options });
      console.log('startAuthentication succeeded:', assertion);
    } catch (error: any) {
      console.error('startAuthentication failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Biometric authentication failed: ${error.message}`);
    }

    console.log('Assertion created successfully:', assertion);

    // Step 3 — send assertion to backend for verification
    return this.getVerifyLogin({
      id: assertion.id,
      rawId: assertion.rawId,
      type: assertion.type,
      username: `fingerprint-${username}`,
      response: assertion.response,
    });
    ``;
  }

  // Face Recognition Methods (uses same WebAuthn flow but with face-specific branding)
  async registerFaceRecognition(userId: string, username: string): Promise<VerifyResponse> {
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('Platform authenticator available for Face ID:', platformAvailable);

    if (!platformAvailable) {
      throw new Error('Face ID is not available. Ensure Face ID is enabled in System Settings.');
    }

    // Step 1 — get challenge + options from backend
    const { options, sessionId } = await this.getRegistrationOptions({
      username,
      displayName: username,
    });

    console.log('Face Recognition options from server:', options);
    console.log('Session ID:', sessionId);

    // Force platform authenticator (Face ID)
    if (options.authenticatorSelection) {
      options.authenticatorSelection.authenticatorAttachment = 'platform';
      options.authenticatorSelection.requireResidentKey = true;
      options.authenticatorSelection.residentKey = 'required';
      options.authenticatorSelection.userVerification = 'required';
    }

    console.log('Modified options for Face ID:', options);

    // Step 2 — browser prompts for Face ID
    console.log('About to call startRegistration for Face ID...');

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
      console.log('Face ID registration succeeded:', credential);
    } catch (error: any) {
      console.error('Face ID registration failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Face recognition failed: ${error.message}`);
    }

    console.log('Face ID credential created successfully:', credential);

    // Step 3 — send credential to backend for verification
    return this.getVerifyRegistration({
      id: credential.id,
      rawId: credential.rawId,
      type: credential.type,
      username,
      response: credential.response,
    });
  }

  async authenticateFaceRecognition(username: string): Promise<VerifyResponse> {
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('Platform authenticator available for Face ID:', platformAvailable);

    if (!platformAvailable) {
      throw new Error('Face ID is not available. Ensure Face ID is enabled in System Settings.');
    }

    // Step 1 — get challenge + options from backend
    const { options, sessionId } = await this.getLoginOptions({ username });

    console.log('Face ID login options from server:', options);
    console.log('Session ID:', sessionId);

    // Ensure allowCredentials have platform transports
    if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
      options.allowCredentials = options.allowCredentials.map((cred: any) => ({
        ...cred,
        transports: ['internal'], // Force platform authenticator (Face ID)
      }));
    }

    console.log('Modified Face ID login options:', options);

    // Step 2 — browser prompts for Face ID authentication
    console.log('About to call startAuthentication for Face ID...');

    let assertion;
    try {
      assertion = await startAuthentication({ optionsJSON: options });
      console.log('Face ID authentication succeeded:', assertion);
    } catch (error: any) {
      console.error('Face ID authentication failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Face recognition authentication failed: ${error.message}`);
    }

    console.log('Face ID assertion created successfully:', assertion);

    // Step 3 — send assertion to backend for verification
    return this.getVerifyLogin({
      id: assertion.id,
      rawId: assertion.rawId,
      type: assertion.type,
      username,
      response: assertion.response,
    });
  }

  async authenticatePasskey(username: string): Promise<VerifyResponse> {
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log('Platform authenticator available for Passkey:', platformAvailable);

    if (!platformAvailable) {
      throw new Error(
        'A platform passkey is not available on this device. Enable Touch ID, Face ID, or another device passkey provider.'
      );
    }

    // Step 1 — get challenge + options from backend
    const { options, sessionId } = await this.getLoginOptions({ username });

    console.log('Passkey login options from server:', options);
    console.log('Session ID:', sessionId);

    // Ensure allowCredentials have platform transports
    if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
      options.allowCredentials = options.allowCredentials.map((cred: any) => ({
        ...cred,
        transports: ['internal'], // Force platform authenticator (passkey)
      }));
    }

    console.log('Modified Passkey login options:', options);

    // Step 2 — browser prompts for passkey authentication
    console.log('About to call startAuthentication for Passkey...');

    let assertion;
    try {
      assertion = await startAuthentication({ optionsJSON: options });
      console.log('Passkey authentication succeeded:', assertion);
    } catch (error: any) {
      console.error('Passkey authentication failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Passkey authentication failed: ${error.message}`);
    }

    console.log('Passkey assertion created successfully:', assertion);

    // Step 3 — send assertion to backend for verification
    return this.getVerifyLogin({
      id: assertion.id,
      rawId: assertion.rawId,
      type: assertion.type,
      username,
      response: assertion.response,
    });
  }

  async registerFingerprint(userId: string, username: string): Promise<VerifyResponse> {
    return this.registerWebAuthnCredential(userId, username, 'fingerprint');
  }

  async registerFaceId(userId: string, username: string): Promise<VerifyResponse> {
    return this.registerWebAuthnCredential(userId, username, 'faceId');
  }

  async registerPasskey(pin: string, username: string): Promise<VerifyResponse> {
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!platformAvailable) {
      throw new Error('Touch ID is not available. Ensure Touch ID is enabled in System Settings.');
    }

    // Pass the PIN to the backend so it can store it alongside the WebAuthn credential.
    // Uses the same /register/options + /register/verify endpoints as fingerprint/faceId.
    const { options, sessionId } = await this.getRegistrationOptions({
      username,
      displayName: username,
      pin,
    });

    console.log('Passkey PIN registration options:', options);
    console.log('Session ID:', sessionId);

    // Force platform authenticator — no QR code / phone dialog.
    options.authenticatorSelection = {
      ...(options.authenticatorSelection ?? {}),
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    };

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
      console.log('Passkey PIN registration succeeded:', credential);
    } catch (error: any) {
      console.error('Passkey PIN registration failed:', error);
      throw new Error(`Passkey registration failed: ${error?.message}`);
    }

    return this.getVerifyRegistration({
      id: credential.id,
      rawId: credential.rawId,
      type: credential.type,
      username,
      response: credential.response,
    });
  }

  async registerBiometric(userId: string, username: string): Promise<VerifyResponse> {
    return this.registerFingerprint(userId, username);
  }

  private async registerWebAuthnCredential(
    userId: string,
    username: string,
    mode: PlatformRegistrationMode
  ): Promise<VerifyResponse> {
    // Fingerprint always uses the device's built-in biometric (Touch ID / Windows Hello).
    // Face ID and Passkey omit the attachment so the browser shows its own dialog,
    // letting the user pick: nearby iPhone (Face ID), iCloud Keychain, security key, etc.
    const usePlatformOnly = mode === 'fingerprint';

    if (usePlatformOnly) {
      const platformAvailable =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      console.log(`${mode} platformAvailable`, platformAvailable, userId);

      if (!platformAvailable) {
        throw new Error(this.getUnavailableMessage(mode));
      }
    }

    const { options, sessionId } = await this.getRegistrationOptions({
      username,
      displayName: username,
    });

    console.log(`${mode} registration options from server:`, options);
    console.log('Session ID:', sessionId);

    if (usePlatformOnly) {
      // Fingerprint: force platform authenticator (Touch ID / Windows Hello)
      options.authenticatorSelection = {
        ...(options.authenticatorSelection ?? {}),
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      };
    } else if (mode === 'faceId') {
      // Camera has already scanned the face; bind the credential to this device's
      // platform authenticator (Touch ID / Windows Hello) for secure storage.
      options.authenticatorSelection = {
        ...(options.authenticatorSelection ?? {}),
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      };
    } else {
      // Passkey: require a discoverable (resident) credential; let the browser/OS
      // show its full passkey dialog (iCloud Keychain, nearby device, security key).
      options.authenticatorSelection = {
        ...(options.authenticatorSelection ?? {}),
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required',
        // authenticatorAttachment intentionally NOT set — shows passkey creation dialog
      };
    }

    console.log(`Modified options for ${mode}:`, options);

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
      console.log(`${mode} registration succeeded:`, credential);
    } catch (error: any) {
      console.error(`${mode} registration failed:`, error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(this.getRegistrationErrorMessage(mode, error?.message));
    }

    return this.getVerifyRegistration({
      id: credential.id,
      rawId: credential.rawId,
      type: credential.type,
      username,
      response: credential.response,
    });
  }

  private getUnavailableMessage(mode: PlatformRegistrationMode): string {
    if (mode === 'faceId') {
      return 'Face ID is not available. Ensure Face ID is enabled in System Settings.';
    }

    if (mode === 'passkey') {
      return 'A platform passkey is not available on this device. Enable Touch ID, Face ID, or another device passkey provider.';
    }

    return 'Touch ID is not available. Ensure Touch ID is enabled in System Settings.';
  }

  private getRegistrationErrorMessage(
    mode: PlatformRegistrationMode,
    fallbackMessage?: string
  ): string {
    const baseMessage = fallbackMessage || 'The registration prompt could not be completed.';

    if (mode === 'faceId') {
      return `Face ID registration failed: ${baseMessage}`;
    }

    if (mode === 'passkey') {
      return `Passkey registration failed: ${baseMessage}`;
    }

    return `Fingerprint registration failed: ${baseMessage}`;
  }
}
