// This service handles WebAuthn/Passkeys interactions and password-based key derivation.

// 1. Generate a key from a password (PBKDF2) - used for authentication simulation
export const generateKeyFromPassword = async (password: string, saltIn: Uint8Array): Promise<CryptoKey> => {
  const salt = new Uint8Array(saltIn); // Force correct type
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    // The key is derived but its usage for AES is no longer needed on the client for shared data
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"] // Kept for potential future client-side field encryption
  );
};

// Helper function to generate a random buffer for WebAuthn
const generateRandomBuffer = (): ArrayBuffer => {
    const arr = new Uint8Array(32);
    return window.crypto.getRandomValues(arr).buffer;
};

// 2. Create Passkey using WebAuthn API
export const createPasskey = async (email: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a real app, the challenge and user.id would come from the server
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: generateRandomBuffer(),
      rp: {
        name: "KMU CyberGuard",
        id: window.location.hostname.split('.').slice(-2).join('.'),
      },
      user: {
        id: new TextEncoder().encode(email), // Use a stable ID derived from the email for the demo
        name: email,
        displayName: displayName || email,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform", // e.g., Windows Hello, Touch ID
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    // In a real app, you would send the `credential` object to your server for storage
    return { success: !!credential };
  } catch (err) {
    const errorMessage = (err as Error).message || 'Unbekannter Fehler';
    console.error("Passkey creation failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

// 3. Verify Passkey using WebAuthn API
export const verifyPasskey = async (): Promise<{ success: boolean; error?: string }> => {
   try {
    // In a real app, the challenge and allowCredentials would come from the server
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: generateRandomBuffer(),
      rpId: window.location.hostname.split('.').slice(-2).join('.'),
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
    
    // In a real app, you would send the `assertion` object to your server for verification
    return { success: !!assertion };
  } catch (err)
  {
    const errorMessage = (err as Error).message || 'Unbekannter Fehler';
    console.error("Passkey verification failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
