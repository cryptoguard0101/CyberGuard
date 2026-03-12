import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, ShieldCheck, MessageSquareText, Menu, X, ShieldAlert, LogOut, Handshake, HelpCircle, Book, Cpu, Zap, Trophy, Bell, BellRing, Check, Trash2, Settings as SettingsIcon, UserCog, Power, User as UserIcon, Save, Smartphone, Mail, AlertTriangle, CheckCircle2, FileText, Globe } from 'lucide-react';
import { User, Task, Framework } from '../types';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import AiConfigWizard from './AiConfigWizard';

interface LayoutProps {
  children: React.ReactNode;
  user?: User | null;
  tasks: Task[];
  onLogout?: () => void;
  // New prop to update user state for coaching
  onUpdateUser?: (updates: Partial<User>) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, user, tasks, onLogout, onUpdateUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiWizardOpen, setIsAiWizardOpen] = useState(false);
  const [showInactivityToast, setShowInactivityToast] = useState<string | null>(null);
  
  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // MFA State
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!onUpdateUser || !user) return;
    setIsSaving(true);
    setProfileSuccess(null);
    try {
      await onUpdateUser({ username });
      setProfileSuccess("Profil erfolgreich aktualisiert.");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startMfaSetup = async () => {
    if (!user) return;
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
    } catch {
        setMfaError("Fehler beim Erstellen des QR-Codes.");
    }
  };

  const verifyAndEnableMfa = async () => {
    if (!onUpdateUser || !mfaCode || mfaCode.length !== 6) {
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
        try {
            await onUpdateUser({ mfaSecret: mfaSecret });
            setMfaSetupOpen(false);
            setMfaCode('');
            setProfileSuccess("Authenticator App erfolgreich eingerichtet.");
            setTimeout(() => setProfileSuccess(null), 3000);
        } catch {
            setMfaError("Fehler beim Speichern.");
        }
    } else {
        setMfaError("Ungültiger Code. Bitte versuchen Sie es erneut.");
    }
  };

  const disableMfa = async () => {
    if (!onUpdateUser) return;
    if (confirm("Möchten Sie wirklich auf E-Mail-Codes zurückwechseln? Dies ist weniger sicher.")) {
        await onUpdateUser({ mfaSecret: undefined });
        setProfileSuccess("Auf E-Mail-Authentifizierung zurückgesetzt.");
        setTimeout(() => setProfileSuccess(null), 3000);
    }
  };
  
  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
      {
          id: 'welcome',
          title: 'Willkommen beim CyberCoach',
          message: 'Wir helfen Ihnen, Ihre IT-Sicherheit Schritt für Schritt zu verbessern.',
          type: 'success',
          timestamp: new Date(),
          read: false
      }
  ]);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();

  // Determine if NIS2 should be shown
  const showNis2Warning = useMemo(() => {
    const hasNis2Tasks = tasks.some(t => t.framework === Framework.NIS2);
    const isFlagged = user?.isNis2Relevant === true;
    return hasNis2Tasks || isFlagged;
  }, [tasks, user]);

  

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Coaching Logic & Inactivity Simulation
  useEffect(() => {
    if (user?.coaching?.isActive) {
        // Simulate inactivity check
        const lastActive = new Date(user.coaching.lastInteraction);
        const now = new Date();
        
        // Demo threshold: 1 minute represents "days" in this context
        const demoThreshold = 60 * 1000; 
        
        if (now.getTime() - lastActive.getTime() > demoThreshold && user.coaching.notificationsEnabled) {
             const messages = [
                 "Wir vermissen Sie. 3 kritische Aufgaben warten noch.",
                 "Ihr Sicherheits-Streak ist in Gefahr! Bleiben Sie dran.",
                 "Der Admin hat eine Benachrichtigung erhalten: 'Sicherheits-Check überfällig'."
             ];
             const randomMsg = messages[Math.floor(Math.random() * messages.length)];
             
             // Use a small timeout to avoid synchronous state updates in effect
             setTimeout(() => {
                 // Show Toast
                 setShowInactivityToast(randomMsg);

                 // Add to persistent notifications
                 const newNotification: Notification = {
                     id: Date.now().toString(),
                     title: 'Inaktivität erkannt',
                     message: randomMsg,
                     type: 'warning',
                     timestamp: new Date(),
                     read: false
                 };
                 setNotifications(prev => [newNotification, ...prev]);
                 
                 // Update timestamp to avoid spamming
                 if (onUpdateUser) {
                     onUpdateUser({
                         coaching: {
                             ...user.coaching!,
                             lastInteraction: new Date()
                         }
                     });
                 }
             }, 0);
        }
    }
  }, [user, onUpdateUser]);

  const toggleCoaching = () => {
      if (!onUpdateUser || !user) return;
      
      const newStatus = !user.coaching?.isActive;
      onUpdateUser({
          coaching: {
              isActive: newStatus,
              streakDays: user.coaching?.streakDays || 1,
              lastInteraction: new Date(),
              notificationsEnabled: true
          }
      });
  };

  const markAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
      setNotifications([]);
      setIsNotificationsOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Übersicht', icon: <LayoutDashboard size={20} /> },
    { path: '/onboarding', label: 'Kennenlernen', icon: <Handshake size={20} /> },
    { path: '/audit', label: 'Checklisten', icon: <CheckSquare size={20} /> },
    { path: '/catalog', label: 'Bibliothek', icon: <Book size={20} /> },
    { path: '/assistant', label: 'KI-Berater', icon: <MessageSquareText size={20} /> },
    { path: '/scanner', label: 'Domain-Scanner', icon: <Globe size={20} /> },
    { path: '/emergency', label: 'Notfall-Zentrum', icon: <AlertTriangle size={20} /> },
    { path: '/reporting', label: 'Reporting', icon: <FileText size={20} /> },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ path: '/admin', label: 'Verwaltung', icon: <UserCog size={20} /> });
  }

  navItems.push({ path: '/help', label: 'Hilfe & Anleitung', icon: <HelpCircle size={20} /> });

  const isActive = (path: string) => location.pathname === path;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden relative">
      <AiConfigWizard isOpen={isAiWizardOpen} onClose={() => setIsAiWizardOpen(false)} />

      {/* Inactivity Toast Notification */}
      {showInactivityToast && (
          <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-orange-500 shadow-xl rounded-r-lg p-4 animate-in slide-in-from-right max-w-sm">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                      <BellRing size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-900">E-Mail Simulation</h4>
                      <p className="text-sm text-slate-600 mt-1">{showInactivityToast}</p>
                      <button 
                        onClick={() => setShowInactivityToast(null)}
                        className="text-xs text-orange-600 font-medium mt-2 hover:underline"
                      >
                          Verstanden
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2 font-bold text-xl tracking-tight">
            <ShieldCheck className="text-blue-500" />
            <span>CyberGuard</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* User Status */}
        {user && (
           <div className="px-4 py-6 bg-slate-800/50 border-b border-slate-700">
             <div className="flex items-center gap-3">
               <button 
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg hover:ring-2 hover:ring-blue-400 transition-all"
               >
                 {user.username ? user.username.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
               </button>
               <div className="overflow-hidden flex-1">
                 <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{user.username || user.email}</p>
                    <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Profil bearbeiten"
                    >
                        <SettingsIcon size={14} />
                    </button>
                 </div>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wide bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                        {user.role}
                    </span>
                 </div>
               </div>
             </div>
           </div>
        )}

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-3">
          <button
            onClick={() => {
                setIsSidebarOpen(false);
                setIsAiWizardOpen(true);
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-indigo-900/50 hover:text-indigo-300 border border-transparent hover:border-indigo-800 transition-colors"
          >
             <Cpu size={20} />
             <span className="font-medium">KI-Einstellungen</span>
          </button>

          {onLogout && (
            <button 
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Abmelden</span>
            </button>
          )}

          {showNis2Warning && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mt-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center space-x-2 text-yellow-500 mb-2">
                <ShieldAlert size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">NIS2 Compliance</span>
              </div>
              <p className="text-xs text-slate-400">
                Prüfen Sie regelmäßig Ihren Status, um Bußgelder zu vermeiden.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Z-Index updated to 40 */}
        <header className="bg-white shadow-sm border-b border-slate-200 flex items-center justify-between p-4 z-40 relative">
          <div className="flex items-center lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 mr-4">
                <Menu size={24} />
            </button>
            <span className="font-semibold text-slate-800">KMU CyberGuard</span>
          </div>

          {/* Desktop Title / Spacer */}
          <div className="hidden lg:block font-semibold text-slate-700">
             {/* Dynamic Breadcrumb could go here */}
          </div>
          
          {/* Coaching Widget in Header */}
          <div className="flex items-center gap-3 ml-auto">
              <button 
                onClick={toggleCoaching}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${
                    user?.coaching?.isActive 
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200 text-amber-800' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
                title={user?.coaching?.isActive ? "Coaching aktiv" : "Coaching aktivieren"}
              >
                  {user?.coaching?.isActive ? (
                      <>
                        <div className="bg-amber-400 p-1 rounded-full text-white">
                             <Trophy size={14} />
                        </div>
                        <span className="text-sm font-bold">Level {user.coaching.streakDays}</span>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1" title="Aktiv" />
                        <div 
                          className="ml-2 p-1 hover:bg-amber-200 rounded-full transition-colors text-amber-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCoaching();
                          }}
                          title="Coach deaktivieren"
                        >
                          <Power size={14} />
                        </div>
                      </>
                  ) : (
                      <>
                        <Zap size={16} />
                        <span className="text-sm font-medium hidden md:inline">Coach aktivieren</span>
                      </>
                  )}
              </button>
              
              {user?.coaching?.isActive && (
                  <div className="relative" ref={notificationRef}>
                      <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                      >
                          <Bell size={20} />
                          {unreadCount > 0 && (
                             <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                          )}
                      </button>

                      {/* Dropdown */}
                      {isNotificationsOpen && (
                          <div className="absolute right-0 top-12 w-80 md:w-96 bg-white shadow-xl border border-slate-200 rounded-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                  <h3 className="font-semibold text-slate-900">Benachrichtigungen</h3>
                                  <div className="flex gap-2">
                                      {unreadCount > 0 && (
                                        <button 
                                            onClick={markAllRead}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Check size={12} /> Alles gelesen
                                        </button>
                                      )}
                                      <button 
                                          onClick={clearNotifications}
                                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                                          title="Alle löschen"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                              <div className="max-h-80 overflow-y-auto">
                                  {notifications.length > 0 ? (
                                      notifications.map(notif => (
                                          <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.read ? 'bg-blue-50/50' : ''}`}>
                                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'warning' ? 'bg-orange-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                              <div>
                                                  <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                                      {notif.title}
                                                  </p>
                                                  <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                                                  <p className="text-[10px] text-slate-400 mt-2">
                                                      {notif.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} Uhr
                                                  </p>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <div className="py-8 text-center text-slate-400 text-sm">
                                          <BellRing size={24} className="mx-auto mb-2 opacity-20" />
                                          Keine neuen Nachrichten
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

        {/* Profile Modal */}
        {isProfileOpen && user && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <UserIcon size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Mein Profil</h2>
                        </div>
                        <button onClick={() => setIsProfileOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                        {/* Profile Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Persönliche Informationen</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail Adresse</label>
                                    <input type="email" value={user.email} disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={username} 
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Ihr Name"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <button 
                                            onClick={handleSaveProfile}
                                            disabled={isSaving || username === user.username}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        >
                                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                                            Speichern
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {profileSuccess && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 animate-in slide-in-from-top-1">
                                    <CheckCircle2 size={16} />
                                    {profileSuccess}
                                </div>
                            )}
                        </div>

                        {/* Security Section */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sicherheit</h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${user.mfaSecret ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {user.mfaSecret ? <Smartphone size={24} /> : <Mail size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">
                                                {user.mfaSecret ? 'Authenticator App (Aktiv)' : 'E-Mail Code (Aktiv)'}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {user.mfaSecret 
                                                    ? 'Ihr Konto ist durch eine Authenticator App geschützt.' 
                                                    : 'Ihr Konto ist durch Einmalcodes per E-Mail geschützt.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={user.mfaSecret ? disableMfa : startMfaSetup}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${user.mfaSecret ? 'border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                    >
                                        {user.mfaSecret ? 'Zu E-Mail wechseln' : 'Authenticator einrichten'}
                                    </button>
                                </div>

                                {mfaSetupOpen && !user.mfaSecret && (
                                    <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200">
                                                {mfaQrCode ? <img src={mfaQrCode} alt="QR Code" className="w-40 h-40" /> : <div className="w-40 h-40 bg-slate-100 animate-pulse rounded-lg"></div>}
                                                <div className="mt-4 w-full">
                                                    <p className="text-[10px] text-slate-400 text-center mb-1 uppercase font-bold">Manueller Code</p>
                                                    <div className="bg-slate-100 p-2 rounded text-center font-mono text-xs select-all">{mfaSecret}</div>
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
                                                </div>
                                                {mfaError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2"><AlertTriangle size={14} />{mfaError}</div>}
                                                <div className="flex gap-3">
                                                    <button onClick={() => setMfaSetupOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">Abbrechen</button>
                                                    <button onClick={verifyAndEnableMfa} disabled={mfaCode.length !== 6} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">Aktivieren</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <button onClick={() => setIsProfileOpen(false)} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm">
                            Schließen
                        </button>
                    </div>
                </div>
            </div>
        )}

        <footer className="text-center text-xs text-slate-400 p-4 border-t border-slate-100 bg-white">
          <div className="flex justify-center gap-4 mb-2">
            <Link to="/impressum" className="hover:text-slate-600 transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-slate-600 transition-colors">Datenschutz</Link>
          </div>
          © 2026 KMU CyberGuard. Alle Rechte vorbehalten.
        </footer>
      </div>
    </div>
  );
};

export default Layout;