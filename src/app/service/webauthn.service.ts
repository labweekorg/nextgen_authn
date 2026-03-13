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
      username,
      response: assertion.response,
    });
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

  async registerBiometric(userId: string, username: string): Promise<VerifyResponse> {
    // Demo mode - simulate successful biometric authentication
    // if (this.DEMO_MODE) {
    //   console.log('DEMO MODE: Simulating biometric authentication');

    //   const platformAvailable =
    //     await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    //   console.log('platformAvailable', platformAvailable);

    //   if (!platformAvailable) {
    //     throw new Error(
    //       'Touch ID is not available. Ensure Touch ID is enabled in System Settings.'
    //     );
    //   }

    //   // Simulate a delay for the authentication process
    //   await new Promise((resolve) => setTimeout(resolve, 1500));

    //   // Simulate successful verification
    //   return {
    //     verified: true,
    //     token: 'demo-token-' + Date.now(),
    //     message: 'Demo authentication successful',
    //   };
    // }

    // Production mode - call actual backend
    const platformAvailable =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    console.log(' platformAvailable ', platformAvailable);

    if (!platformAvailable) {
      throw new Error('Touch ID is not available. Ensure Touch ID is enabled in System Settings.');
    }

    // Step 1 — get challenge + options from backend
    // const { options, sessionId } = await firstValueFrom(
    //   this.http
    //     .post<RegisterStartResponse>(`${this.api}/register/start`, {
    //       userId,
    //       username,
    //     })
    //     .pipe(
    //       map((res) => {
    //         return { options: res.options, sessionId: res.sessionId };
    //       })
    //     )
    // );
    const { options, sessionId } = await this.getRegistrationOptions({
      username,
      displayName: username,
    });

    console.log('Options from server:', options);
    console.log('Session ID:', sessionId);

    // Force platform authenticator (Touch ID/Face ID/Windows Hello) instead of cross-platform
    if (options.authenticatorSelection) {
      options.authenticatorSelection.authenticatorAttachment = 'platform';
      options.authenticatorSelection.requireResidentKey = true;
      options.authenticatorSelection.residentKey = 'required';
      options.authenticatorSelection.userVerification = 'required';
    }

    console.log('Modified options for platform authenticator:', options);

    // Step 2 — browser talks to Touch ID/Face ID → TPM generates key pair
    //           User sees the Touch ID/Face ID fingerprint UI here
    console.log('About to call startRegistration...');

    let credential;
    try {
      credential = await startRegistration({ optionsJSON: options });
      console.log('startRegistration succeeded:', credential);
    } catch (error: any) {
      console.error('startRegistration failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      throw new Error(`Biometric authentication failed: ${error.message}`);
    }

    console.log('Credential created successfully:', credential);

    // Step 3 — send credential (public key + attestation) to backend
    // return firstValueFrom(
    //   this.http.post<VerifyResponse>(`${this.api}/register/finish`, {
    //     sessionId: sessionId,
    //     userId: userId,
    //     credential: credential,
    //   })
    // );
    return this.getVerifyRegistration({
      id: credential.id,
      rawId: credential.rawId,
      type: credential.type,
      username,
      response: credential.response,
    });
  }
}
