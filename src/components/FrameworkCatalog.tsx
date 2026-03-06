import React, { useState } from 'react';
import { Book, Plus, Search, RefreshCcw, ShieldCheck, Info, ChevronRight, Library, CheckCircle2 } from 'lucide-react';
import { Task, Framework } from '../types';
import { searchFrameworkModules, importFrameworkModule } from '../services/geminiService';
import { NIS2_TASKS, ISO27001_TASKS, BSI_TASKS, GDPR_TASKS, CIS_TASKS } from '../data/frameworkTasks';
import { INITIAL_TASKS } from '../constants';

interface FrameworkCatalogProps {
  onAddTasks: (tasks: Task[]) => void;
  onRemoveModule: (moduleId: string) => void;
  tasks: Task[];
}

interface SearchResult extends Partial<Task> {
  estTasks?: number;
}

const FrameworkCatalog: React.FC<FrameworkCatalogProps> = ({ onAddTasks, onRemoveModule, tasks }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingModule, setImportingModule] = useState<string | null>(null);
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchFrameworkModules(searchQuery);
      setSearchResults(results as SearchResult[]);
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (module: SearchResult | { title: string, framework: string }) => {
    if (!module.title || !module.framework) return;
    setImportingModule(module.title);
    
    // Special handling for Basic Security
    if (module.framework === Framework.BASIC) {
        // Filter INITIAL_TASKS for BASIC framework
        const basicTasks = INITIAL_TASKS.filter(t => t.framework === Framework.BASIC);
        onAddTasks(basicTasks);
        setImportingModule(null);
        return;
    }

    try {
      const newTasks = await importFrameworkModule(module.framework, module.title);
      if (newTasks.length > 0) {
        onAddTasks(newTasks as Task[]);
      }
    } catch (error) {
      console.error("Import Error:", error);
    } finally {
      setImportingModule(null);
    }
  };

  const allFrameworks = [
    { 
      id: 'basic', 
      name: 'Basis-Sicherheit', 
      description: 'Grundlegende Sicherheitsmaßnahmen für jedes Unternehmen (Virenschutz, Updates, Backups).', 
      framework: Framework.BASIC,
      taskCount: INITIAL_TASKS.filter(t => t.framework === Framework.BASIC).length,
      featured: true
    },
    { 
      id: 'nis2', 
      name: 'NIS2 Richtlinie', 
      description: 'EU-weite Cybersicherheitsvorschriften für kritische Sektoren.', 
      framework: Framework.NIS2,
      taskCount: NIS2_TASKS.length,
      featured: true
    },
    { 
      id: 'iso27001', 
      name: 'ISO 27001', 
      description: 'Internationaler Standard für Informationssicherheits-Managementsysteme.', 
      framework: Framework.ISO27001,
      taskCount: ISO27001_TASKS.length,
      featured: true
    },
    { 
      id: 'bsi', 
      name: 'BSI Grundschutz', 
      description: 'Standard für IT-Sicherheit vom Bundesamt für Sicherheit in der Informationstechnik.', 
      framework: Framework.BSI,
      taskCount: BSI_TASKS.length,
      featured: true
    },
    { 
      id: 'gdpr', 
      name: 'DSGVO / GDPR', 
      description: 'Datenschutz-Grundverordnung für den Schutz personenbezogener Daten.', 
      framework: Framework.GDPR,
      taskCount: GDPR_TASKS.length,
      featured: false
    },
    { 
      id: 'cis', 
      name: 'CIS Controls', 
      description: 'Best Practices für die Abwehr der häufigsten Cyberangriffe.', 
      framework: Framework.CIS,
      taskCount: CIS_TASKS.length,
      featured: false
    },
  ];

  const displayedFrameworks = showAllFrameworks 
    ? allFrameworks 
    : allFrameworks.filter(fw => fw.featured);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Library size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Sicherheits-Bibliothek</h1>
          </div>
          <p className="text-slate-500 text-lg">Erweitern Sie Ihre Compliance-Checkliste um spezifische Frameworks und Module.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nach Modulen suchen (z.B. 'Cloud Sicherheit', 'Passwort-Richtlinie', 'Homeoffice')..." 
            className="w-full pl-14 pr-32 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
          />
          <button 
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <RefreshCcw size={18} className="animate-spin" /> : <Search size={18} />}
            Suchen
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Suchergebnisse
            <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500">{searchResults.length} gefunden</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {searchResults.map((res, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            {res.framework}
                        </span>
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{res.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{res.description}</p>
                  </div>
                  <button 
                    onClick={() => handleImport(res)}
                    disabled={!!importingModule}
                    className="p-2 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                  >
                    {importingModule === res.title ? <RefreshCcw size={20} className="animate-spin" /> : <Plus size={20} />}
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Book size={12} /> {res.estTasks} Aufgaben</span>
                    <span className="flex items-center gap-1"><ShieldCheck size={12} /> KI-Verifiziert</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Frameworks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {showAllFrameworks ? 'Alle Frameworks' : 'Empfohlene Frameworks'}
          </h2>
          <button 
            onClick={() => setShowAllFrameworks(!showAllFrameworks)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            {showAllFrameworks ? 'Weniger anzeigen' : 'Alle anzeigen'}
            <ChevronRight size={16} className={`transition-transform ${showAllFrameworks ? 'rotate-90' : ''}`} />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {displayedFrameworks.map(fw => {
            const isActive = tasks.some(t => t.framework === fw.framework);
            return (
              <div key={fw.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                <div className="p-6 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    fw.id === 'basic' ? 'bg-slate-100 text-slate-700' :
                    fw.id === 'nis2' ? 'bg-blue-50 text-blue-600' : 
                    fw.id === 'iso27001' ? 'bg-green-50 text-green-600' : 
                    fw.id === 'gdpr' ? 'bg-purple-50 text-purple-600' :
                    fw.id === 'cis' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    <Book size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{fw.name}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{fw.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                    <CheckCircle2 size={14} />
                    {fw.taskCount} Maßnahmen enthalten
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {isActive ? 'Aktiviert' : 'Verfügbar'}
                  </span>
                  {isActive ? (
                    fw.id === 'basic' ? (
                        <span className="text-sm font-medium text-slate-400 cursor-not-allowed" title="Basis-Sicherheit kann nicht entfernt werden">
                            Standard
                        </span>
                    ) : (
                        <button 
                          onClick={() => onRemoveModule(fw.id)}
                          className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
                        >
                          Entfernen
                        </button>
                    )
                  ) : (
                    <button 
                      onClick={() => handleImport({ title: fw.name, framework: fw.name })}
                      disabled={!!importingModule}
                      className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {importingModule === fw.name ? <RefreshCcw size={16} className="animate-spin" /> : <Plus size={16} />}
                      Aktivieren
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4">Nicht sicher, was Sie brauchen?</h2>
                <p className="text-indigo-100 mb-6">
                    Unser KI-Berater kann Ihr Unternehmen analysieren und Ihnen die passenden Module vorschlagen. 
                    Starten Sie einfach ein neues Onboarding oder fragen Sie im Chat.
                </p>
                <button 
                    onClick={() => window.location.hash = '#/onboarding'}
                    className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                >
                    Onboarding starten <ChevronRight size={20} />
                </button>
            </div>
            <div className="w-48 h-48 bg-indigo-800/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-700">
                <Info size={80} className="text-indigo-300 opacity-50" />
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-800 rounded-full opacity-20"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-700 rounded-full opacity-10"></div>
      </div>
    </div>
  );
};

export default FrameworkCatalog;
