import React, { useState } from 'react';
import { MailCheck } from 'lucide-react';

import { ShieldAlert } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerify: (code: string) => void;
  onBack: () => void;
  error?: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onVerify, onBack, error }) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailCheck size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">E-Mail bestätigen</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
          Wir haben einen Code an <strong>{email}</strong> gesendet. Bitte geben Sie ihn unten ein.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}
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

        <div className="text-center">
            <button 
                type="button"
                className="text-xs text-blue-600 hover:underline"
            >
                Code erneut senden
            </button>
        </div>

        <button
          type="submit"
          disabled={code.length !== 6}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          Bestätigen & Weiter
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

export default EmailVerification;
