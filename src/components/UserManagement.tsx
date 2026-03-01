import React from 'react';
import { UserPlus } from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  users: User[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Benutzerverwaltung</h1>
          <p className="text-slate-500">Verwalten Sie Teammitglieder und deren Berechtigungen.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus size={18} />
          Benutzer einladen
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Benutzer</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rolle</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zuletzt aktiv</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      {user.username?.charAt(0) || user.email.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{user.username || 'Unbenannt'}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isLocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-slate-600">{user.isLocked ? 'Gesperrt' : 'Aktiv'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Nie'}
                </td>
                <td className="px-6 py-4">
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
