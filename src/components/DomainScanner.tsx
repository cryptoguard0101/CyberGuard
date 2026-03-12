import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Globe, Lock, Mail, Key, PlusCircle, RefreshCcw } from 'lucide-react';
import { Task, TaskStatus, Framework } from '../types';

interface DomainScannerProps {
  onAddTasks: (tasks: Task[]) => void;
}

const DomainScanner: React.FC<DomainScannerProps> = ({ onAddTasks }) => {
  const [domain, setDomain] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [addedTasks, setAddedTasks] = useState<string[]>([]);

  const handleScan = async () => {
    if (!domain.trim()) return;
    
    setIsScanning(true);
    setScanResults(null);
    setAddedTasks([]);

    // Simulate OSINT scan (in a real app, this would call a backend API that queries SSL Labs, DNS records, HIBP, etc.)
    setTimeout(() => {
      const isSecure = !domain.includes('bad'); // simple mock logic
      
      setScanResults({
        domain: domain,
        ssl: {
          valid: isSecure,
          issuer: isSecure ? "Let's Encrypt Authority X3" : "Unknown",
          expiresIn: isSecure ? 45 : -10,
          issue: isSecure ? null : "Zertifikat abgelaufen oder ungültig"
        },
        email: {
          spf: isSecure,
          dmarc: false, // Always show an issue for demo purposes
          issue: "DMARC Record fehlt oder ist fehlerhaft konfiguriert"
        },
        leaks: {
          found: !isSecure,
          count: isSecure ? 0 : 3,
          issue: isSecure ? null : "Passwörter dieser Domain in bekannten Leaks gefunden (HaveIBeenPwned)"
        }
      });
      setIsScanning(false);
    }, 2500);
  };

  const createTasksFromResults = () => {
    if (!scanResults) return;

    const newTasks: Task[] = [];

    if (!scanResults.ssl.valid) {
      newTasks.push({
        id: `osint-ssl-${Date.now()}`,
        title: 'SSL-Zertifikat erneuern/prüfen',
        description: `Das SSL-Zertifikat für ${scanResults.domain} ist ungültig oder abgelaufen. Bitte umgehend prüfen und erneuern.`,
        category: 'Infrastruktur',
        status: TaskStatus.TODO,
        framework: Framework.BASIC,
        impact: 'HIGH',
        source: 'GENERATOR'
      });
    }

    if (!scanResults.email.dmarc || !scanResults.email.spf) {
      newTasks.push({
        id: `osint-email-${Date.now()}`,
        title: 'E-Mail-Sicherheit (SPF/DMARC) konfigurieren',
        description: `Für die Domain ${scanResults.domain} fehlen wichtige E-Mail-Sicherheitsstandards (SPF/DMARC). Dies begünstigt E-Mail-Spoofing.`,
        category: 'Infrastruktur',
        status: TaskStatus.TODO,
        framework: Framework.BSI,
        impact: 'MEDIUM',
        source: 'GENERATOR'
      });
    }

    if (scanResults.leaks.found) {
      newTasks.push({
        id: `osint-leaks-${Date.now()}`,
        title: 'Kompromittierte Passwörter zurücksetzen',
        description: `Es wurden ${scanResults.leaks.count} Leaks für E-Mail-Adressen der Domain ${scanResults.domain} gefunden. Betroffene Nutzer identifizieren und Passwörter sofort zurücksetzen.`,
        category: 'Identität & Zugriff',
        status: TaskStatus.TODO,
        framework: Framework.BASIC,
        impact: 'HIGH',
        source: 'GENERATOR'
      });
    }

    if (newTasks.length > 0) {
      onAddTasks(newTasks);
      setAddedTasks(newTasks.map(t => t.id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Globe size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">OSINT Domain-Scanner</h1>
              <p className="text-slate-400 mt-1">Automatische Überprüfung Ihrer externen Angriffsfläche.</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Domain überprüfen</h2>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Globe className="text-slate-400" size={20} />
            </div>
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="z.B. beispiel-firma.de"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning || !domain.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
          >
            {isScanning ? <RefreshCcw size={20} className="animate-spin" /> : <Search size={20} />}
            Scannen
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
          <ShieldAlert size={12} />
          Prüft SSL-Zertifikate, E-Mail-Sicherheit (SPF/DMARC) und bekannte Passwort-Leaks.
        </p>
      </div>

      {scanResults && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Scan-Ergebnisse für {scanResults.domain}</h2>
            {(!scanResults.ssl.valid || !scanResults.email.dmarc || scanResults.leaks.found) && addedTasks.length === 0 && (
              <button 
                onClick={createTasksFromResults}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm border border-indigo-200"
              >
                <PlusCircle size={16} />
                Als To-Dos übernehmen
              </button>
            )}
            {addedTasks.length > 0 && (
              <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <CheckCircle2 size={16} />
                To-Dos erstellt
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* SSL Status */}
            <div className={`p-5 rounded-2xl border ${scanResults.ssl.valid ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${scanResults.ssl.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Lock size={24} />
                </div>
                {scanResults.ssl.valid ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">SSL/TLS Zertifikat</h3>
              {scanResults.ssl.valid ? (
                <p className="text-sm text-slate-600">Gültig (läuft in {scanResults.ssl.expiresIn} Tagen ab)</p>
              ) : (
                <p className="text-sm text-red-700 font-medium">{scanResults.ssl.issue}</p>
              )}
            </div>

            {/* Email Security */}
            <div className={`p-5 rounded-2xl border ${scanResults.email.spf && scanResults.email.dmarc ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${scanResults.email.spf && scanResults.email.dmarc ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Mail size={24} />
                </div>
                {scanResults.email.spf && scanResults.email.dmarc ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-amber-500" />}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">E-Mail Sicherheit</h3>
              {scanResults.email.spf && scanResults.email.dmarc ? (
                <p className="text-sm text-slate-600">SPF und DMARC korrekt konfiguriert</p>
              ) : (
                <p className="text-sm text-amber-700 font-medium">{scanResults.email.issue}</p>
              )}
            </div>

            {/* Leaks */}
            <div className={`p-5 rounded-2xl border ${!scanResults.leaks.found ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${!scanResults.leaks.found ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  <Key size={24} />
                </div>
                {!scanResults.leaks.found ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Passwort-Leaks</h3>
              {!scanResults.leaks.found ? (
                <p className="text-sm text-slate-600">Keine bekannten Leaks gefunden</p>
              ) : (
                <p className="text-sm text-red-700 font-medium">{scanResults.leaks.count} Leaks gefunden</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DomainScanner;
