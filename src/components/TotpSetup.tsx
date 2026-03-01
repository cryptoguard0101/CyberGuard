import React, { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';

interface TotpSetupProps {
  onVerify: (code: string) => void;
  onBack: () => void;
}

const TotpSetup: React.FC<TotpSetupProps> = ({ onVerify, onBack }) => {
  const [code, setCode] = useState('');

  // In a real app, this would be a real QR code from the server
  const fakeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/KMU%20CyberGuard:demo@user.com?secret=JBSWY3DPEHPK3PXP&issuer=KMU%20CyberGuard`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
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

      <div className="flex justify-center">
        <img src={fakeQrCodeUrl} alt="QR Code" className="rounded-lg border-4 border-white shadow-md" />
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
