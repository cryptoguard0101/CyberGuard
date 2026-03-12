import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, ShieldAlert, FileText, ChevronRight, Plus, Trash2, Edit2, Save, X, Mail } from 'lucide-react';
import { EmergencyContact } from '../types';

const EmergencyHub: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({});

  useEffect(() => {
    const saved = localStorage.getItem('cyberguard-emergency-contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load contacts", e);
      }
    } else {
      // Default contacts
      setContacts([
        { id: '1', role: 'IT-Dienstleister', name: 'Max Mustermann', phone: '+49 123 456789', email: 'support@it-dienstleister.de' },
        { id: '2', role: 'Datenschutzbeauftragter', name: 'Anna Schmidt', phone: '+49 987 654321', email: 'dsb@unternehmen.de' },
        { id: '3', role: 'Cyber-Versicherung', name: 'Versicherung AG', phone: '+49 800 112233', email: 'schaden@versicherung.de', notes: 'Policen-Nr: 123456789' }
      ]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cyberguard-emergency-contacts', JSON.stringify(contacts));
  }, [contacts]);

  const handleAddContact = () => {
    if (!newContact.name || !newContact.role) return;
    const contact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      role: newContact.role,
      name: newContact.name,
      phone: newContact.phone || '',
      email: newContact.email || '',
      notes: newContact.notes
    };
    setContacts([...contacts, contact]);
    setNewContact({});
    setIsEditing(false);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const playbooks = [
    {
      id: 'ransomware',
      title: 'Ransomware-Verdacht',
      description: 'Bildschirm gesperrt oder Dateien verschlüsselt.',
      steps: [
        'Gerät sofort vom Netzwerk trennen (WLAN aus, LAN-Kabel ziehen).',
        'Gerät NICHT ausschalten (wichtig für forensische Analysen).',
        'IT-Dienstleister umgehend informieren.',
        'Kein Lösegeld zahlen!',
        'Geschäftsführung und Datenschutzbeauftragten informieren.'
      ]
    },
    {
      id: 'phishing',
      title: 'Phishing-Link geklickt',
      description: 'Verdächtiger Link angeklickt oder Daten eingegeben.',
      steps: [
        'Sofort das Passwort des betroffenen Kontos ändern (von einem anderen Gerät aus).',
        'IT-Dienstleister informieren, um das Konto auf verdächtige Aktivitäten zu prüfen.',
        'Zwei-Faktor-Authentifizierung (2FA) aktivieren, falls noch nicht geschehen.',
        'Kollegen warnen, falls die E-Mail intern weitergeleitet wurde.'
      ]
    },
    {
      id: 'hardware',
      title: 'Gerät verloren / gestohlen',
      description: 'Dienst-Laptop oder Smartphone fehlt.',
      steps: [
        'IT-Dienstleister kontaktieren, um das Gerät aus der Ferne zu sperren oder zu löschen (Remote Wipe).',
        'Passwörter aller Konten ändern, die auf dem Gerät gespeichert waren.',
        'Verlust bei der Polizei melden.',
        'Datenschutzbeauftragten informieren (möglicher Datenabfluss).'
      ]
    }
  ];

  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-red-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notfall-Zentrum</h1>
              <p className="text-red-100 mt-1">Schnelle Hilfe und Handlungsanweisungen bei Sicherheitsvorfällen.</p>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500 rounded-full opacity-50 blur-3xl"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Playbooks */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-slate-400" />
            <h2 className="text-xl font-bold text-slate-800">Notfall-Playbooks</h2>
          </div>
          
          <div className="space-y-4">
            {playbooks.map(pb => (
              <div key={pb.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <button 
                  onClick={() => setExpandedPlaybook(expandedPlaybook === pb.id ? null : pb.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-slate-900">{pb.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{pb.description}</p>
                  </div>
                  <div className={`p-2 rounded-full transition-transform ${expandedPlaybook === pb.id ? 'bg-red-50 text-red-600 rotate-90' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronRight size={20} />
                  </div>
                </button>
                
                {expandedPlaybook === pb.id && (
                  <div className="p-5 bg-slate-50 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sofortmaßnahmen</h4>
                    <ul className="space-y-3">
                      {pb.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-700">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contacts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Phone className="text-slate-400" />
              <h2 className="text-xl font-bold text-slate-800">Wichtige Kontakte</h2>
            </div>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {isEditing && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-blue-900">Neuer Kontakt</h3>
                <button onClick={() => setIsEditing(false)} className="text-blue-400 hover:text-blue-600"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Rolle (z.B. IT-Support)" value={newContact.role || ''} onChange={e => setNewContact({...newContact, role: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <input type="text" placeholder="Name" value={newContact.name || ''} onChange={e => setNewContact({...newContact, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <input type="text" placeholder="Telefon" value={newContact.phone || ''} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <input type="email" placeholder="E-Mail" value={newContact.email || ''} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <input type="text" placeholder="Notizen (optional)" value={newContact.notes || ''} onChange={e => setNewContact({...newContact, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                <button onClick={handleAddContact} disabled={!newContact.name || !newContact.role} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">Speichern</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
                <button 
                  onClick={() => handleRemoveContact(contact.id)}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <div className="pr-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{contact.role}</h3>
                  <p className="font-bold text-slate-900 text-lg">{contact.name}</p>
                  <div className="mt-3 space-y-1">
                    {contact.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {contact.phone}</p>}
                    {contact.email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {contact.email}</p>}
                    {contact.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100">{contact.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyHub;
