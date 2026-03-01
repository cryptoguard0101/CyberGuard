import React from 'react';

const LocalSetupInstructions: React.FC = () => {
  return (
    <div className="p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
      <h3 className="font-bold">Lokaler Modus Aktiv</h3>
      <p>Sie befinden sich im lokalen Modus. Um die Anwendung lokal auszuführen, folgen Sie diesen Schritten:</p>
      <ol className="list-decimal list-inside mt-2">
        <li>Stellen Sie sicher, dass Sie Node.js und npm installiert haben.</li>
        <li>Laden Sie den Quellcode herunter.</li>
        <li>Öffnen Sie ein Terminal im Projektverzeichnis.</li>
        <li>Führen Sie `npm install` aus, um die Abhängigkeiten zu installieren.</li>
        <li>Führen Sie `npm run dev` aus, um den lokalen Entwicklungsserver zu starten.</li>
        <li>Öffnen Sie Ihren Browser und navigieren Sie zu http://localhost:3000.</li>
      </ol>
      <p className="mt-4">Die Daten werden lokal in Ihrem Browser gespeichert.</p>
    </div>
  );
};

export default LocalSetupInstructions;
