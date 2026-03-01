import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Datenschutz: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Datenschutzerklärung</h1>
          <p className="text-slate-500">Informationen zur Verarbeitung Ihrer Daten</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6">
          <ArrowLeft size={16} />
          Zurück
        </button>
        <h2>1. Allgemeines</h2>
        <p>
          Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
        </p>

        <h2>2. Datenerfassung auf dieser Website</h2>
        <p>
          Verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist der im Impressum genannte Anbieter. Wir verarbeiten personenbezogene Daten, die Sie uns übermitteln, nur zum Zweck der Bereitstellung eines funktionsfähigen Dienstes sowie unserer Inhalte und Leistungen.
        </p>

        <h2>3. Ihre Rechte</h2>
        <p>
          Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
        </p>

        <h2>4. Cookies</h2>
        <p>
          Unsere Anwendung verwendet notwendige Cookies, um die Funktionalität sicherzustellen. Diese Cookies speichern keine persönlichen Informationen.
        </p>

        <p>
          <em>Dies ist ein Platzhaltertext. Bitte ersetzen Sie ihn durch Ihre vollständige und rechtlich geprüfte Datenschutzerklärung.</em>
        </p>
      </div>
    </div>
  );
};

export default Datenschutz;
