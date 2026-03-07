import React, { useState } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, Settings as SettingsIcon, Monitor, Shield, Lock, Smartphone, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';

interface SettingsProps {
  isLocalMode: boolean;
  onToggleLocalMode: () => void;
  user: User;
  onUpdateUser: (updates: Partial<User>) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ isLocalMode, onToggleLocalMode, user, onUpdateUser }) => {
  const [username, setUsername] = useState(user.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // MFA State
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
      setIsSaving(true);
      setSuccessMessage(null);
      try {
        await onUpdateUser({ username });
        setSuccessMessage("Profil erfolgreich aktualisiert.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Failed to update profile", error);
      } finally {
        setIsSaving(false);
      }
  };

  const startMfaSetup = async () => {
    // Generate new secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;
    setMfaSecret(secretBase32);

    const totp = new OTPAuth.TOTP({
        issuer: 'KMU CyberGuard',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret
    });

    const uri = totp.toString();
    try {
        const qr = await QRCode.toDataURL(uri);
        setMfaQrCode(qr);
        setMfaSetupOpen(true);
        setMfaError(null);
    } catch (err) {
        console.error("QR Code Error", err);
        setMfaError("Fehler beim Erstellen des QR-Codes.");
    }
  };

  const verifyAndEnableMfa = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
        setMfaError("Bitte geben Sie einen 6-stelligen Code ein.");
        return;
    }

    const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(mfaSecret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30
    });
    
    const delta = totp.validate({ token: mfaCode, window: 1 });
    if (delta !== null) {
        // Success
        try {
            // We pass undefined to remove the property, but TypeScript might complain if Partial<User> expects string | undefined
            // In our User type, mfaSecret is optional (string | undefined).
            // However, JSON.stringify might strip undefined.
            // Let's assume onUpdateUser handles it.
            await onUpdateUser({ mfaSecret: mfaSecret });
            setMfaSetupOpen(false);
            setMfaCode('');
            setSuccessMessage("Authenticator App erfolgreich eingerichtet.");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            setMfaError("Fehler beim Speichern.");
        }
    } else {
        setMfaError("Ungültiger Code. Bitte versuchen Sie es erneut.");
    }
  };

  const disableMfa = async () => {
    if (confirm("Möchten Sie wirklich auf E-Mail-Codes zurückwechseln? Dies ist weniger sicher.")) {
        await onUpdateUser({ mfaSecret: undefined }); // Remove secret
        setSuccessMessage("Auf E-Mail-Authentifizierung zurückgesetzt.");
        setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <SettingsIcon size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Einstellungen</h1>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Benutzerprofil</h2>
        </div>
        <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail Adresse</label>
                    <input 
                        type="email" 
                        value={user.email} 
                        disabled 
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Die E-Mail Adresse kann nicht geändert werden.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename (Optional)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ihr Name"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button 
                            onClick={handleSaveProfile}
                            disabled={isSaving || username === user.username}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                        >
                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                            Speichern
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Dieser Name wird im Dashboard und in Berichten angezeigt.</p>
                    {successMessage && (
                        <p className="text-sm text-green-600 mt-2 font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-1">
                            <CheckCircle2 size={14} /> {successMessage}
                        </p>
                    )}
                </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Rolle & Berechtigungen</span>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.role}
                </div>
            </div>
        </div>
      </div>

      {/* Security Settings (MFA) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Lock size={18} className="text-amber-600" />
            <h2 className="font-bold text-slate-800">Sicherheit & Authentifizierung</h2>
        </div>
        <div className="p-6">
            <h3 className="font-medium text-slate-900 mb-2">Zwei-Faktor-Authentifizierung (2FA)</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${user.mfaSecret ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {user.mfaSecret ? <Smartphone size={24} /> : <Mail size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">
                                {user.mfaSecret ? 'Authenticator App (Aktiv)' : 'E-Mail Code (Aktiv)'}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                                {user.mfaSecret 
                                    ? 'Ihr Konto ist durch eine Authenticator App (z.B. Google Authenticator) geschützt.' 
                                    : 'Ihr Konto ist durch Einmalcodes per E-Mail geschützt.'}
                            </p>
                        </div>
                    </div>
                    <div>
                        {user.mfaSecret ? (
                            <button 
                                onClick={disableMfa}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium transition-colors"
                            >
                                Zu E-Mail wechseln
                            </button>
                        ) : (
                            <button 
                                onClick={startMfaSetup}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                            >
                                Authenticator einrichten
                            </button>
                        )}
                    </div>
                </div>

                {/* MFA Setup Area */}
                {mfaSetupOpen && !user.mfaSecret && (
                    <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-slate-900 mb-4">Authenticator App einrichten</h4>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200">
                                {mfaQrCode ? (
                                    <img src={mfaQrCode} alt="QR Code" className="w-48 h-48" />
                                ) : (
                                    <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg"></div>
                                )}
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Scannen Sie diesen Code mit Ihrer Authenticator App (Google, Microsoft, etc.)
                                </p>
                                <div className="mt-4 w-full">
                                    <p className="text-xs text-slate-400 text-center mb-1">Oder manuell eingeben:</p>
                                    <div className="bg-slate-100 p-2 rounded text-center font-mono text-xs select-all">
                                        {mfaSecret}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bestätigungscode</label>
                                    <input 
                                        type="text" 
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 text-lg tracking-widest text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        maxLength={6}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Geben Sie den 6-stelligen Code aus Ihrer App ein, um die Einrichtung abzuschließen.
                                    </p>
                                </div>
                                
                                {mfaError && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                        <AlertTriangle size={16} />
                                        {mfaError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={() => setMfaSetupOpen(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                                    >
                                        Abbrechen
                                    </button>
                                    <button 
                                        onClick={verifyAndEnableMfa}
                                        disabled={mfaCode.length !== 6}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                    >
                                        Aktivieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Monitor size={18} className="text-slate-600" />
            <h2 className="font-bold text-slate-800">System</h2>
        </div>
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-slate-900">Lokaler KI-Modus (Ollama)</h3>
                    <p className="text-sm text-slate-500 mt-1">Verwenden Sie eine lokale KI-Instanz statt der Cloud für maximale Privatsphäre.</p>
                </div>
                <button
                onClick={onToggleLocalMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLocalMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLocalMode ? 'translate-x-6' : 'translate-x-1'}`}
                />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
