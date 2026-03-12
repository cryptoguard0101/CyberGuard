import React, { useState, useMemo } from 'react';
import { FileText, Download, ShieldCheck, AlertTriangle, CheckCircle2, FileSignature, Sparkles, RefreshCcw } from 'lucide-react';
import { Task, TaskStatus, Framework } from '../types';
import { getGeminiInstance } from '../services/geminiService';
import Markdown from 'react-markdown';

interface ReportingHubProps {
  tasks: Task[];
}

const ReportingHub: React.FC<ReportingHubProps> = ({ tasks }) => {
  const [isGeneratingPolicy, setIsGeneratingPolicy] = useState(false);
  const [generatedPolicy, setGeneratedPolicy] = useState<string | null>(null);
  const [policyTopic, setPolicyTopic] = useState('Home-Office Richtlinie');

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const open = tasks.filter(t => t.status === TaskStatus.TODO).length;
    
    const score = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, done, inProgress, open, score };
  }, [tasks]);

  const handlePrint = () => {
    window.print();
  };

  const generatePolicy = async () => {
    setIsGeneratingPolicy(true);
    setGeneratedPolicy(null);
    try {
      const ai = getGeminiInstance();
      if (!ai) {
        throw new Error("API-Schlüssel fehlt. Bitte konfigurieren Sie die KI-Einstellungen.");
      }
      const prompt = `Erstelle eine professionelle, rechtlich unverbindliche Vorlage für eine "${policyTopic}" für ein kleines bis mittleres Unternehmen (KMU). 
      Die Richtlinie sollte folgende Abschnitte enthalten:
      1. Ziel und Zweck
      2. Geltungsbereich
      3. Konkrete Verhaltensregeln und technische Vorgaben
      4. Verantwortlichkeiten
      5. Inkrafttreten
      
      Formuliere den Text klar, verständlich und praxisnah. Verwende Markdown-Formatierung.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setGeneratedPolicy(response.text || "Keine Antwort generiert.");
    } catch (error) {
      console.error("Policy Generation Error:", error);
      setGeneratedPolicy("Fehler bei der Generierung der Richtlinie. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsGeneratingPolicy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reporting & Compliance</h1>
          <p className="text-slate-500 mt-1">Audit-Berichte und Richtlinien-Generator für Ihr KMU.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg"
        >
          <Download size={20} />
          PDF Report
        </button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-4xl font-bold text-slate-900">CyberGuard Compliance Report</h1>
        <p className="text-slate-500 mt-2">Erstellt am: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Score Dashboard */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-lg font-medium text-blue-100 mb-2">Compliance Score</h2>
            <div className="text-6xl font-black tracking-tighter mb-2">{stats.score}%</div>
            <p className="text-sm text-blue-200">
              {stats.score >= 80 ? 'Ausgezeichnetes Sicherheitsniveau' : stats.score >= 50 ? 'Solides Fundament, weiteres Potenzial' : 'Kritischer Handlungsbedarf'}
            </p>
          </div>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white rounded-full opacity-10 blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-2xl"></div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
              <h3 className="font-bold text-slate-700">Abgeschlossen</h3>
            </div>
            <div className="text-4xl font-black text-slate-900">{stats.done}</div>
            <p className="text-sm text-slate-500 mt-1">von {stats.total} Maßnahmen</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><AlertTriangle size={24} /></div>
              <h3 className="font-bold text-slate-700">Offen</h3>
            </div>
            <div className="text-4xl font-black text-slate-900">{stats.open + stats.inProgress}</div>
            <p className="text-sm text-slate-500 mt-1">Maßnahmen ausstehend</p>
          </div>
        </div>
      </div>

      {/* Task Summary for Print */}
      <div className="hidden print:block mt-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Umgesetzte Maßnahmen</h2>
        <div className="space-y-4">
          {tasks.filter(t => t.status === TaskStatus.DONE).map(task => (
            <div key={task.id} className="flex gap-4 items-start">
              <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-slate-800">{task.title}</h3>
                <p className="text-sm text-slate-600">{task.description}</p>
                <div className="text-xs text-slate-400 mt-1">Framework: {task.framework} | Priorität: {task.impact}</div>
              </div>
            </div>
          ))}
          {tasks.filter(t => t.status === TaskStatus.DONE).length === 0 && (
            <p className="text-slate-500 italic">Noch keine Maßnahmen abgeschlossen.</p>
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6 border-b border-slate-200 pb-2">Offene Maßnahmen (Roadmap)</h2>
        <div className="space-y-4">
          {tasks.filter(t => t.status !== TaskStatus.DONE).map(task => (
            <div key={task.id} className="flex gap-4 items-start">
              <div className="w-5 h-5 rounded border-2 border-slate-300 mt-1 flex-shrink-0"></div>
              <div>
                <h3 className="font-bold text-slate-800">{task.title}</h3>
                <div className="text-xs text-slate-400 mt-1">Framework: {task.framework} | Priorität: {task.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Builder (Hidden in Print) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <FileSignature size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">KI-Richtlinien-Generator</h2>
            <p className="text-sm text-slate-500">Erstellen Sie Standarddokumente für Ihr Unternehmen auf Knopfdruck.</p>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <select 
              value={policyTopic}
              onChange={(e) => setPolicyTopic(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Home-Office Richtlinie">Home-Office Richtlinie</option>
              <option value="Passwort-Richtlinie">Passwort-Richtlinie</option>
              <option value="Bring-Your-Own-Device (BYOD) Richtlinie">Bring-Your-Own-Device (BYOD)</option>
              <option value="Richtlinie zur Nutzung von KI-Tools">Nutzung von KI-Tools (ChatGPT etc.)</option>
              <option value="Notfallplan IT-Ausfall">Notfallplan IT-Ausfall</option>
            </select>
            <button 
              onClick={generatePolicy}
              disabled={isGeneratingPolicy}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isGeneratingPolicy ? <RefreshCcw size={20} className="animate-spin" /> : <Sparkles size={20} />}
              Generieren
            </button>
          </div>

          {generatedPolicy && (
            <div className="mt-8 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900">Generierte Richtlinie: {policyTopic}</h3>
                <button 
                  onClick={() => {
                    const blob = new Blob([generatedPolicy], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${policyTopic.replace(/\s+/g, '_')}.md`;
                    a.click();
                  }}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Als Markdown speichern
                </button>
              </div>
              <div className="prose prose-slate max-w-none bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <Markdown>{generatedPolicy}</Markdown>
              </div>
              <p className="text-xs text-slate-400 mt-4 italic">
                Hinweis: Diese Richtlinie wurde durch KI generiert und stellt keine Rechtsberatung dar. Bitte passen Sie die Inhalte an Ihre spezifischen Unternehmensbedürfnisse an.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportingHub;
