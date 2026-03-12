import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, Fingerprint, RefreshCcw, ArrowRight, ShieldAlert, Trash2, Mail } from 'lucide-react';
import { generateKeyFromPassword } from '../services/cryptoService';
import { User } from '../types';
import { calculateStrength } from '../utils/passwordUtils';
import TotpSetup from './TotpSetup';
import EmailVerification from './EmailVerification';
import PasswordReset from './PasswordReset';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import * as OTPAuth from 'otpauth';
import { resetApp } from '../services/apiService';

interface AuthScreensProps {
  onLogin: (username: string, key: string, user?: User) => void;
  onLoginFail: (username: string) => void;
  onRegister: (userData: Partial<User>) => Promise<{success: boolean, error?: string, user?: User}>;
  users: User[]; // Pass existing users to check for locks/expiry
}

export const AuthScreens: React.FC<AuthScreensProps> = ({ onLogin, onLoginFail, onRegister, users }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState<'credentials' | 'email-verification' | 'mfa' | 'totp-setup' | 'totp-verify' | 'password-reset' | 'email-otp-login'>('credentials');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState<string | false>(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [totpLoginCode, setTotpLoginCode] = useState('');

  // Hold-to-reset state
  const [resetHoldProgress, setResetHoldProgress] = useState(0);
  const [isHoldingReset, setIsHoldingReset] = useState(false);
  const resetIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 10000; // 10 seconds
  const UPDATE_INTERVAL = 100; // Update progress every 100ms

  const handleResetStart = () => {
    setIsHoldingReset(true);
    setResetHoldProgress(0);
    
    const startTime = Date.now();
    
    resetIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setResetHoldProgress(progress);
      
      if (progress >= 100) {
        handleResetConfirm();
      }
    }, UPDATE_INTERVAL);
  };

  const handleResetEnd = () => {
    setIsHoldingReset(false);
    setResetHoldProgress(0);
    if (resetIntervalRef.current) clearInterval(resetIntervalRef.current);
  };

  const handleResetConfirm = async () => {
    handleResetEnd();
    if (confirm("Sind Sie sicher? Alle lokalen Daten werden gelöscht und die App wird zurückgesetzt. Dies kann nicht rückgängig gemacht werden.")) {
        await resetApp();
        window.location.reload();
    }
  };

  // Automatically switch to registration if no users exist
  useEffect(() => {
    if (users.length === 0) {
      setIsRegistering(true);
    }
  }, [users]);

  // Simulated Salt for demo purposes (In real app, store per user)
  const DEMO_SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);


  const validateUserStatus = (usernameOrEmail: string): { valid: boolean; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === usernameOrEmail.toLowerCase() || u.username?.toLowerCase() === usernameOrEmail.toLowerCase());
    if (!user) return { valid: false, error: 'Benutzername oder Passwort ist falsch.' };

    if (user.isLocked) {
        return { valid: false, error: 'Account ist gesperrt. Bitte wenden Sie sich an den Administrator.' };
    }

    if (user.validUntil && new Date() > new Date(user.validUntil)) {
        return { valid: false, error: 'Zugang ist abgelaufen.' };
    }

    return { valid: true };
  };

  const sendVerificationEmail = async (targetEmail: string): Promise<string | null> => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: 'KMU CyberGuard - Ihr Bestätigungscode',
            text: `Ihr Bestätigungscode lautet: ${code}\n\nDieser Code ist 10 Minuten gültig.`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; text-align: center; background-color: #f8fafc;">
                <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 400px; margin: 0 auto;">
                  <p style="color: #64748b; margin-bottom: 10px; font-size: 16px;">Ihr Bestätigungscode lautet:</p>
                  <h2 style="font-size: 36px; letter-spacing: 6px; color: #2563eb; margin: 10px 0; font-weight: 800;">${code}</h2>
                  <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">Dieser Code ist 10 Minuten gültig.</p>
                </div>
              </div>
            `
          })
        });

        if (!response.ok) {
           throw new Error('Email sending failed');
        }
        return code;
      } catch (error) {
        console.error('Error sending email:', error);
        setError('Fehler beim Senden der E-Mail. Bitte überprüfen Sie die Server-Logs.');
        return null;
      }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
        const emailExists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
            setError('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
            return;
        }
        const strength = calculateStrength(password);
        if (strength < 3) {
            setError('Das Passwort ist noch zu schwach.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Die Passwörter stimmen nicht überein.');
            return;
        }
    } else {
        const userExists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!userExists) {
            setError('Benutzername oder Passwort ist falsch.');
            onLoginFail(email);
            return;
        }

        const status = validateUserStatus(email);
        if (!status.valid) {
            setError(status.error || 'Login nicht möglich.');
            return;
        }
    }

    setLoading('credentials');
    
    if (isRegistering) {
      const code = await sendVerificationEmail(email);
      if (code) {
          setVerificationCode(code);
          setLoading(false);
          setStep('email-verification');
      } else {
          setLoading(false);
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        setStep('mfa');
      }, 800);
    }
  };

  const handleMfaEmail = async () => {
      setLoading('email-otp');
      const code = await sendVerificationEmail(email);
      if (code) {
          setVerificationCode(code);
          setStep('email-otp-login');
      }
      setLoading(false);
  };

  const handleEmailLoginVerify = async (code: string) => {
      if (code === verificationCode) {
          let newUser: User | undefined;
          
          if (isRegistering) {
              const regResult = await onRegister({
                email,
                username: username || email.split('@')[0],
                role: 'ADMIN',
                encryptionKey: "",
                validUntil: null
              });
              
              if (!regResult.success) {
                setError(regResult.error || 'Registrierung fehlgeschlagen.');
                return;
              }
              newUser = regResult.user;
          }
          
          const key = await generateKeyFromPassword(password, DEMO_SALT);
          onLogin(email, key, newUser);
      } else {
          setError('Falscher Bestätigungscode.');
          onLoginFail(email);
      }
  };

  const handleMfaTotp = async () => {
    if (isRegistering) {
      setStep('totp-setup');
    } else {
      setStep('totp-verify');
    }
  };

  const handleTotpSetupComplete = async (code: string, secret: string) => {
    setLoading('totp');
    let newUser: User | undefined;
    if (isRegistering) {
      const regResult = await onRegister({
        email,
        username: username || email.split('@')[0],
        role: 'ADMIN',
        encryptionKey: "",
        validUntil: null,
        mfaSecret: secret // Store the secret!
      });
      if (!regResult.success) {
        setError(regResult.error || 'Registrierung fehlgeschlagen.');
        setLoading(false);
        return;
      }
      newUser = regResult.user;
    }
    const key = await generateKeyFromPassword(password, DEMO_SALT);
    onLogin(email, key, newUser);
    setLoading(false);
  };

  const handleTotpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('totp');
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.mfaSecret) {
        setError('Kein MFA-Secret für diesen Benutzer gefunden.');
        setLoading(false);
        return;
    }

    const totp = new OTPAuth.TOTP({
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
    });

    const delta = totp.validate({ token: totpLoginCode, window: 1 });

    if (delta !== null) {
        const key = await generateKeyFromPassword(password, DEMO_SALT);
        onLogin(email, key);
    } else {
        setError('Ungültiger Code.');
        onLoginFail(email);
    }
    setLoading(false);
  };

  const loginUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const hasTotp = !!loginUser?.mfaSecret;
  const showEmailMfa = isRegistering || !hasTotp;
  const showTotpMfa = isRegistering || hasTotp;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <ShieldCheck size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">KMU CyberGuard</h1>
          <p className="text-blue-200 text-sm mt-2">
            Sicherheitsplattform für Teams
          </p>
        </div>

        <div className="p-8">
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  {isRegistering ? 'Benutzerkonto erstellen' : 'Anmelden'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isRegistering ? 'Erstellen Sie den ersten Administrator-Account.' : 'Melden Sie sich an Ihrem Arbeitsbereich an.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail-Adresse</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="ihre@email.de"
                />
              </div>

              {isRegistering && (
                <div className="-mt-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename <span className="text-slate-400">(Optional)</span></label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Max Mustermann"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort bestätigen</label>
                  <div className="relative">
                     <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                     <input
                        type="password"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                      />
                  </div>
                  {password.length > 0 && password !== passwordConfirm && (
                    <p className="text-xs text-red-500 mt-1.5">Passwörter stimmen nicht überein.</p>
                  )}
                  <PasswordStrengthMeter password={password} />
                </div>
              )}
              </div>

              {error && (
                <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                  <ShieldAlert size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!!loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === 'credentials' ? <RefreshCcw className="animate-spin" /> : <ArrowRight />}
                {isRegistering ? 'Weiter zur Sicherheitseinrichtung' : 'Weiter'}
              </button>

              <div className="text-center mt-4">
                 {users.length > 0 && (
                     <div className="flex justify-center items-center gap-4">
                    {users.length > 0 && !isRegistering && (
                        <button type="button" onClick={() => setStep('password-reset')} className="text-sm text-slate-500 hover:underline">
                            Passwort vergessen?
                        </button>
                    )}
                     <button
                        type="button"
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); }}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isRegistering ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                    </button>
                   </div>
                 )}
              </div>
            </form>
          )}
          {step === 'mfa' && (
             <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fingerprint size={32} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {isRegistering ? 'Sicherheit einrichten' : 'Anmeldung bestätigen'}
                </h2>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                  Um die höchste Sicherheitsstufe zu gewährleisten, ist ein zweiter Faktor zwingend erforderlich.
                </p>
              </div>

              {showEmailMfa && (
              <button
                onClick={handleMfaEmail}
                disabled={!!loading}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-between group shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg group-hover:bg-blue-400 transition-colors">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">Code per E-Mail senden</div>
                    <div className="text-xs text-blue-100">{loading === 'email-otp' ? 'Sende E-Mail...' : 'Einmalcode anfordern'}</div>
                  </div>
                </div>
                {loading === 'email-otp' ? <RefreshCcw className="animate-spin" /> : <ArrowRight size={20} />}
              </button>
              )}

              {showEmailMfa && showTotpMfa && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">oder</span>
                </div>
              </div>
              )}

              {showTotpMfa && (
              <button
                onClick={handleMfaTotp}
                disabled={!!loading}
                className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <KeyRound size={20} className="text-slate-600" />
                 </div>
                 <span>Authenticator Code</span>
              </button>
              )}

              <button
                onClick={() => { setStep('credentials'); setError(''); /* Keep email */ }}
                className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4"
              >
                Zurück
              </button>
            </div>
          )}
          {step === 'email-otp-login' && (
            <EmailVerification 
              email={email} 
              error={error}
              onVerify={handleEmailLoginVerify} 
              onBack={() => { setStep('mfa'); setError(''); }} 
            />
          )}
          {step === 'email-verification' && (
            <EmailVerification 
              email={email} 
              error={error}
              onVerify={(code) => {
                if (code === verificationCode) {
                  setError('');
                  setStep('mfa');
                } else {
                  setError('Falscher Bestätigungscode.');
                }
              }} 
              onBack={() => { setStep('credentials'); setError(''); /* Keep email */ }} 
            />
          )}
          {step === 'totp-setup' && (
            <TotpSetup 
              onVerify={handleTotpSetupComplete} 
              onBack={() => setStep('mfa')} 
              email={email}
            />
          )}
          {step === 'totp-verify' && (
             <div className="space-y-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <KeyRound size={32} className="text-slate-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Authenticator Code</h2>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        Bitte geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.
                    </p>
                </div>

                <form onSubmit={handleTotpLogin} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={totpLoginCode}
                            onChange={(e) => setTotpLoginCode(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-center tracking-[0.5em] font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="_ _ _ _ _ _"
                            autoFocus
                        />
                    </div>
                     {error && (
                        <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                            <ShieldAlert size={16} />
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={totpLoginCode.length !== 6 || !!loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading === 'totp' ? <RefreshCcw className="animate-spin" /> : <ArrowRight />}
                        Anmelden
                    </button>
                </form>
                 <button
                    onClick={() => { setStep('mfa'); setError(''); setTotpLoginCode(''); }}
                    className="w-full text-sm text-slate-400 hover:text-slate-600 mt-4"
                >
                    Zurück
                </button>
             </div>
          )}
          {step === 'password-reset' && (
            <PasswordReset 
              users={users} 
              onBackToLogin={() => setStep('credentials')} 
            />
          )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 relative overflow-hidden">
          {isHoldingReset && (
            <div 
                className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear"
                style={{ width: `${resetHoldProgress}%` }}
            />
          )}
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-2">
            <Lock size={10} />
            Entspricht NIST 800-63B & NIS2 Anforderungen
          </p>
          <button 
            onMouseDown={handleResetStart}
            onMouseUp={handleResetEnd}
            onMouseLeave={handleResetEnd}
            onTouchStart={handleResetStart}
            onTouchEnd={handleResetEnd}
            className={`text-[10px] flex items-center justify-center gap-1 mx-auto transition-all select-none ${isHoldingReset ? 'text-red-600 font-bold scale-110' : 'text-slate-300 hover:text-red-500'}`}
            title="Gedrückt halten zum Zurücksetzen (10s)"
          >
            <Trash2 size={10} />
            {isHoldingReset ? `ZURÜCKSETZEN IN ${Math.ceil((100 - resetHoldProgress) / 10)}s...` : 'App zurücksetzen (10s gedrückt halten)'}
          </button>
        </div>
      </div>
    </div>
  );
};
