import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
    PublicKeyCredentialRequestOptionsJSON,
    PublicKeyCredentialCreationOptionsJSON
} from '@simplewebauthn/browser';
import { firstValueFrom, map } from "rxjs";


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

@Injectable({ providedIn: 'root' })
export class WebAuthnService {

   private readonly api = 'http://localhost:8080/api/webauthn';

  constructor(private http: HttpClient) {}

async isSupported(): Promise<boolean> {
    return browserSupportsWebAuthn();
  }

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    return platformAuthenticatorIsAvailable();
  }


    async registerBiometric(userId: string, username: string): Promise<VerifyResponse> {

      const platformAvailable =
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
console.log(" platformAvailable ",platformAvailable);

     if (!platformAvailable) {
    throw new Error(
      'Touch ID is not available. Ensure Touch ID is enabled in System Settings.'
    );
  }

    // Step 1 — get challenge + options from backend
    const { options, sessionId } = await firstValueFrom(
      this.http.post<RegisterStartResponse>(`${this.api}/register/start`, {
        userId,
        username,
      }).pipe(map(res => {return {options: res.options, sessionId: res.sessionId}}))
    );

    console.log('Options from server:',  JSON.parse(options).publicKey);

    console.log(" options ",options);
    console.log(" session ",sessionId);
    
    var obj = JSON.parse(options).publicKey;

    // Step 2 — browser talks to Windows Hello → TPM generates key pair
    //           User sees the Windows Hello fingerprint UI here
    const credential = await startRegistration({optionsJSON: obj});

    console.log(" credential ",credential);
    
    // Step 3 — send credential (public key + attestation) to backend
    return firstValueFrom(
      this.http.post<VerifyResponse>(`${this.api}/register/finish`, {
        sessionId:sessionId,
        userId:userId,
        credential:credential,
      })
    );
  }

}