import React, { useState } from 'react';
import { HelpCircle, Book, MessageSquare, ShieldCheck, ChevronRight, Search, ExternalLink, Info, AlertTriangle, CheckCircle2, Lock, Globe, Cpu } from 'lucide-react';
import Markdown from 'react-markdown';

const HelpSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'articles' | 'docs'>('articles');

  const helpArticles = [
    {
      id: 'nis2',
      category: 'Compliance',
      title: 'NIS2 Richtlinie verstehen',
      excerpt: 'Was die neue EU-Richtlinie für deutsche KMUs bedeutet und wer betroffen ist.',
      content: `Die NIS2-Richtlinie (Network and Information Security) ist eine EU-weite Gesetzgebung zur Cybersicherheit. 
Sie zielt darauf ab, ein hohes gemeinsames Sicherheitsniveau in der gesamten Union zu erreichen.

### Wer ist betroffen?
Unternehmen in "wesentlichen" und "wichtigen" Sektoren (z.B. Energie, Gesundheit, Banken, aber auch Abfallwirtschaft und Lebensmittel). 
In der Regel sind Unternehmen ab **50 Mitarbeitern** oder **10 Mio. € Umsatz** betroffen, aber es gibt Ausnahmen für kritische Infrastrukturen.

### Was sind die Anforderungen?
- **Risikomanagement-Maßnahmen**: Implementierung technischer und organisatorischer Maßnahmen.
- **Berichtspflichten**: Meldung erheblicher Sicherheitsvorfälle innerhalb von 24 Stunden.
- **Sicherheit der Lieferkette**: Prüfung der Sicherheit von Zulieferern und Dienstleistern.
- **Schulung der Geschäftsführung**: Verpflichtende Schulungen und persönliche Haftung bei Versäumnissen.`
    },
    {
      id: '2fa',
      category: 'Sicherheit',
      title: 'Zwei-Faktor-Authentifizierung (2FA)',
      excerpt: 'So schützen Sie Ihre Konten effektiv vor unbefugtem Zugriff.',
      content: `2FA fügt eine zusätzliche Sicherheitsebene hinzu. Selbst wenn ein Passwort gestohlen wird, bleibt das Konto geschützt.

### Methoden in CyberGuard:
- **Authenticator Apps (TOTP)**: Generiert alle 30 Sekunden einen neuen Code (z.B. Google Authenticator, Authy).
- **Passkeys**: Die modernste und sicherste Methode. Nutzt Biometrie (Fingerabdruck, Gesichtsscan) oder Hardware-Sicherheitsschlüssel.
- **Hardware-Tokens**: Physische Geräte wie YubiKeys.`
    },
    {
      id: 'onboarding',
      category: 'App-Nutzung',
      title: 'Kennenlernen (Onboarding)',
      excerpt: 'Wie der CyberCoach Ihr individuelles Sicherheitsprofil erstellt.',
      content: `Der Onboarding-Prozess ist das Herzstück von CyberGuard. Durch ein kurzes Interview mit unserer KI wird Ihr Unternehmen analysiert.

### Der Ablauf:
1. **Unternehmensprofil**: Wir fragen nach Branche, Größe und IT-Infrastruktur.
2. **KI-Analyse**: Unsere KI bewertet Ihre Antworten basierend auf NIST und BSI Standards.
3. **Maßgeschneiderte Checkliste**: Sie erhalten eine Liste mit priorisierten Aufgaben.

Sie können das Onboarding jederzeit wiederholen, wenn sich Ihr Unternehmen verändert oder Sie neue Schwerpunkte setzen möchten.`
    }
  ];

  const documentation = [
    {
      title: 'Erste Schritte',
      icon: <Globe className="text-blue-500" />,
      items: [
        { name: 'Dashboard Übersicht', desc: 'Lernen Sie die wichtigsten Kennzahlen kennen.' },
        { name: 'Profil einrichten', desc: 'Vervollständigen Sie Ihre Unternehmensdaten.' },
        { name: 'Benutzer einladen', desc: 'Arbeiten Sie im Team an Ihrer Sicherheit.' }
      ]
    },
    {
      title: 'Sicherheits-Module',
      icon: <Lock className="text-green-500" />,
      items: [
        { name: 'Passwort-Management', desc: 'Richtlinien für sichere Authentifizierung.' },
        { name: 'Netzwerksicherheit', desc: 'Schutz Ihrer internen Infrastruktur.' },
        { name: 'Backup-Strategien', desc: 'Vermeidung von Datenverlust durch Ransomware.' }
      ]
    },
    {
      title: 'KI-Funktionen',
      icon: <Cpu className="text-purple-500" />,
      items: [
        { name: 'KI-Assistent nutzen', desc: 'Fragen Sie CyberGuard nach Expertenrat.' },
        { name: 'Dokumenten-Prüfung', desc: 'Lassen Sie Nachweise automatisch verifizieren.' },
        { name: 'Roadmap Generierung', desc: 'Planen Sie Ihre nächsten Schritte strategisch.' }
      ]
    }
  ];

  const filteredArticles = helpArticles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={14} /> Support Center
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Wie können wir Ihnen helfen?</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Finden Sie Antworten auf häufige Fragen oder lernen Sie, wie Sie CyberGuard optimal für Ihr Unternehmen einsetzen.
        </p>
        
        <div className="max-w-2xl mx-auto mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen Sie nach Themen (z.B. NIS2, Passkeys)..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('articles')}
          className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'articles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Hilfe-Artikel
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Dokumentation
        </button>
      </div>

      {activeTab === 'articles' ? (
        <>
          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6">
            <div onClick={() => setActiveTab('docs')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Book size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Dokumentation</h3>
              <p className="text-sm text-slate-500 mt-2">Detaillierte Anleitungen zu allen Modulen und Frameworks.</p>
              <div className="mt-4 flex items-center text-blue-600 text-sm font-bold">
                Mehr erfahren <ChevronRight size={16} />
              </div>
            </div>
            <div onClick={() => window.location.hash = '#/assistant'} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-all">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-bold text-slate-900">KI Chat</h3>
              <p className="text-sm text-slate-500 mt-2">Sprechen Sie direkt mit unserem KI-Sicherheitsberater.</p>
              <div className="mt-4 flex items-center text-green-600 text-sm font-bold">
                Chat starten <ChevronRight size={16} />
              </div>
            </div>
            <div onClick={() => window.location.hash = '#/catalog'} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Compliance-Check</h3>
              <p className="text-sm text-slate-500 mt-2">Prüfen Sie, ob Ihr Unternehmen NIS2-relevant ist.</p>
              <div className="mt-4 flex items-center text-purple-600 text-sm font-bold">
                Check starten <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Articles Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Wichtige Artikel</h2>
            <div className="grid gap-6">
              {filteredArticles.map(article => (
                <div key={article.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                  <div className="p-8 flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{article.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{article.excerpt}</p>
                    
                    <div className="pt-4 border-t border-slate-50">
                        <div className="prose prose-slate prose-sm max-w-none text-slate-600">
                            <Markdown>{article.content}</Markdown>
                        </div>
                    </div>
                  </div>
                  <div className="md:w-64 bg-slate-50 p-8 border-l border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
                    <Info size={32} className="text-slate-300" />
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Verwandte Links</p>
                    <div className="space-y-2 w-full">
                        <button className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-blue-300 transition-all">
                            NIST Framework <ExternalLink size={12} />
                        </button>
                        <button className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-blue-300 transition-all">
                            BSI Grundschutz <ExternalLink size={12} />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredArticles.length === 0 && (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <Search size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">Keine Artikel zu "{searchQuery}" gefunden.</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 font-bold mt-2 hover:underline"
                    >
                        Suche zurücksetzen
                    </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          {documentation.map((section, idx) => (
            <div key={idx} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                  {section.icon}
                </div>
                <h3 className="font-bold text-slate-900">{section.title}</h3>
              </div>
              <div className="space-y-4">
                {section.items.map((item, iidx) => (
                  <div key={iidx} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NIS2 Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <AlertTriangle size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-amber-900">Achtung: NIS2 Frist nähert sich</h3>
            <p className="text-amber-800 mt-1">
                Bis Oktober 2026 müssen betroffene Unternehmen die NIS2-Anforderungen umgesetzt haben. 
                Nutzen Sie unsere Checklisten, um rechtzeitig compliant zu sein.
            </p>
        </div>
        <button onClick={() => window.location.hash = '#/catalog'} className="px-6 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 whitespace-nowrap">
            Jetzt prüfen
        </button>
      </div>

      {/* Footer Support */}
      <div className="bg-slate-900 rounded-3xl p-10 text-white text-center space-y-6">
        <h2 className="text-3xl font-bold">Noch Fragen offen?</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
            Unser Support-Team steht Ihnen werktags von 09:00 bis 17:00 Uhr zur Verfügung. 
            Oder nutzen Sie unseren KI-Assistenten rund um die Uhr.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 opacity-75 cursor-not-allowed" disabled>
                <MessageSquare size={20} /> Live-Chat (Coming Soon)
            </button>
            <button className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={20} /> Systemstatus: OK
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
