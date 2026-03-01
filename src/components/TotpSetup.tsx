import React, { useState, useMemo } from 'react';
import { KeyRound, Check } from 'lucide-react';
import * as OTPAuth from 'otpauth';

interface TotpSetupProps {
  onVerify: (code: string, secret: string) => void;
  onBack: () => void;
  email?: string;
}

const TotpSetup: React.FC<TotpSetupProps> = ({ onVerify, onBack, email = 'user@example.com' }) => {
  const [code, setCode] = useState('');
  // Initialize secret once
  const [secret] = useState(() => new OTPAuth.Secret({ size: 20 }));

  const qrCodeUrl = useMemo(() => {
    const totp = new OTPAuth.TOTP({
      issuer: 'KMU CyberGuard',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    const uri = totp.toString();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
  }, [email, secret]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && secret) {
      const totp = new OTPAuth.TOTP({
        issuer: 'KMU CyberGuard',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Verify the code with a window of 1 (allows for slight clock drift)
      const delta = totp.validate({ token: code, window: 1 });

      if (delta !== null) {
        onVerify(code, secret.base32);
      } else {
        alert('Der Code ist ungültig. Bitte versuchen Sie es erneut.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={32} className="text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Authenticator einrichten</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
          Scannen Sie den QR-Code mit Ihrer Authenticator-App (z.B. Google Authenticator) und geben Sie den Code ein.
        </p>
      </div>

      <div className="flex justify-center flex-col items-center gap-4">
        {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="QR Code" className="rounded-lg border-4 border-white shadow-md" />
        ) : (
            <div className="w-[200px] h-[200px] bg-slate-100 rounded-lg animate-pulse"></div>
        )}
        {secret && (
            <div className="text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                Secret: {secret.base32}
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">6-stelliger Bestätigungscode</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={6}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="_ _ _ _ _ _"
          />
        </div>

        <button
          type="submit"
          disabled={code.length !== 6}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check />
          Einrichtung abschließen
        </button>
      </form>

      <button
        onClick={onBack}
        className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4"
      >
        Zurück
      </button>
    </div>
  );
};

export default TotpSetup;
