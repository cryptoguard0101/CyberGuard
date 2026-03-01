import React from 'react';
import { BookUser, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Impressum: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
          <BookUser size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Impressum</h1>
          <p className="text-slate-500">Angaben gemäß § 5 TMG</p>
        </div>
      </div>

      <div className="prose prose-slate max-w-none">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6">
          <ArrowLeft size={16} />
          Zurück
        </button>
        <h2>Anbieter:</h2>
        <p>
          [Ihr Name/Firmenname]<br />
          [Ihre Straße und Hausnummer]<br />
          [Ihre PLZ und Stadt]<br />
          [Ihr Land]
        </p>

        <h2>Kontakt:</h2>
        <p>
          Telefon: [Ihre Telefonnummer]<br />
          E-Mail: [Ihre E-Mail-Adresse]
        </p>

        <h2>Vertreten durch:</h2>
        <p>
          [Name des Geschäftsführers/Vertretungsberechtigten]
        </p>

        <h2>Umsatzsteuer-ID:</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz:<br />
          [Ihre USt-IdNr.]
        </p>

        <h2>Haftungsausschluss:</h2>
        <p>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
        </p>
      </div>
    </div>
  );
};

export default Impressum;
