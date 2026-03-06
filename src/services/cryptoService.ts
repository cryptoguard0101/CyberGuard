import CryptoJS from 'crypto-js';

// This service handles WebAuthn/Passkeys interactions and password-based key derivation.

// 1. Generate a key from a password (PBKDF2) - used for authentication simulation
export const generateKeyFromPassword = async (password: string, saltIn: Uint8Array): Promise<string> => {
  // Convert Uint8Array salt to WordArray for CryptoJS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const salt = CryptoJS.lib.WordArray.create(saltIn as any);
  
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000,
    hasher: CryptoJS.algo.SHA256
  });

  return key.toString(CryptoJS.enc.Base64);
};

// Helper function to generate a random buffer for WebAuthn
const generateRandomBuffer = (): ArrayBuffer => {
    const arr = new Uint8Array(32);
    // Use CryptoJS for random values if window.crypto is not available (HTTP context)
    const randomWords = CryptoJS.lib.WordArray.random(32);
    // Convert WordArray to Uint8Array
    for (let i = 0; i < 32; i++) {
        arr[i] = (randomWords.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return arr.buffer;
};

// 2. Create Passkey using WebAuthn API
export const createPasskey = async (email: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
  // Check for secure context
  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return { success: false, error: 'Passkeys erfordern eine sichere Verbindung (HTTPS).' };
  }

  try {
    // In a real app, the challenge and user.id would come from the server
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: generateRandomBuffer(),
      rp: {
        name: "KMU CyberGuard",
        // id: window.location.hostname, // Let browser default to current origin to avoid domain issues
      },
      user: {
        id: new TextEncoder().encode(email), // Use a stable ID derived from the email for the demo
        name: email,
        displayName: displayName || email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        // authenticatorAttachment: "platform", // Allow cross-platform (e.g. YubiKey, Phone) too
        userVerification: "preferred", // Changed from required to preferred to reduce friction
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none", // Changed from direct to none for privacy/compatibility
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
   // Check for secure context
   if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
     return { success: false, error: 'Passkeys erfordern eine sichere Verbindung (HTTPS).' };
   }

   try {
    // In a real app, the challenge and allowCredentials would come from the server
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: generateRandomBuffer(),
      rpId: window.location.hostname, // Use hostname directly
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
