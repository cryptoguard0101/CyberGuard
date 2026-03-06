import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { UserCog, Lock, Unlock, Search, UserPlus } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import NewUserDialog from './NewUserDialog';

interface AdminPageProps {
  users: User[];
  onToggleUserLock: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: UserRole) => void;
  onCreateUser: (userData: Omit<User, 'id' | 'lastLogin' | 'isLocked' | 'mfaSecret' | 'passkeyCredential'> & { password?: string }) => Promise<{success: boolean, error?: string}>;
  onResetMfa: (userId: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ users, onToggleUserLock, onChangeUserRole, onCreateUser, onResetMfa }) => {
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [userForLock, setUserForLock] = useState<User | null>(null);
  
  const [mfaResetDialogOpen, setMfaResetDialogOpen] = useState(false);
  const [userForMfaReset, setUserForMfaReset] = useState<User | null>(null);

  const [roleChangeState, setRoleChangeState] = useState<{isOpen: boolean, user: User | null, newRole: UserRole | null}>({isOpen: false, user: null, newRole: null});
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    return users.filter(user => 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <UserCog size={28} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Verwaltung</h1>
            <p className="text-slate-500">Verwalten Sie Benutzerkonten, Rollen und Sicherheits-Einstellungen.</p>
        </div>
        <div className="ml-auto">
            <button 
                onClick={() => setIsNewUserDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
                <UserPlus size={16} />
                Neuen Benutzer anlegen
            </button>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={lockDialogOpen}
        onClose={() => setLockDialogOpen(false)}
        onConfirm={() => {
          if (userForLock) {
            onToggleUserLock(userForLock.id);
          }
        }}
        title={`Benutzer ${userForLock?.isLocked ? 'entsperren' : 'sperren'}?`}
        message={`Sind Sie sicher, dass Sie das Konto von ${userForLock?.email} ${userForLock?.isLocked ? 'entsperren' : 'sperren'} möchten?`}
        confirmButtonText={userForLock?.isLocked ? 'Entsperren' : 'Sperren'}
        confirmButtonColor={userForLock?.isLocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
      />

      <ConfirmationDialog
        isOpen={mfaResetDialogOpen}
        onClose={() => setMfaResetDialogOpen(false)}
        onConfirm={() => {
          if (userForMfaReset) {
            onResetMfa(userForMfaReset.id);
          }
        }}
        title="2FA zurücksetzen?"
        message={`Sind Sie sicher, dass Sie die Zwei-Faktor-Authentifizierung für ${userForMfaReset?.email} zurücksetzen möchten? Der Benutzer muss sie beim nächsten Login neu einrichten.`}
        confirmButtonText="Zurücksetzen"
        confirmButtonColor="bg-amber-600 hover:bg-amber-700"
      />

      <ConfirmationDialog
        isOpen={roleChangeState.isOpen}
        onClose={() => setRoleChangeState({isOpen: false, user: null, newRole: null})} // Cleanup on close
        onConfirm={() => {
          if (roleChangeState.user && roleChangeState.newRole) {
            onChangeUserRole(roleChangeState.user.id, roleChangeState.newRole);
          }
        }}
        title="Rolle ändern?"
        message={`Sind Sie sicher, dass Sie die Rolle für ${roleChangeState.user?.email} zu "${roleChangeState.newRole}" ändern möchten?`}
        confirmButtonText="Rolle ändern"
        confirmButtonColor="bg-blue-600 hover:bg-blue-700"
      />

      <NewUserDialog 
        isOpen={isNewUserDialogOpen}
        onClose={() => setIsNewUserDialogOpen(false)}
        onCreateUser={onCreateUser}
      />

      <div className="mb-4 relative">
        <input 
          type="text"
          placeholder="Benutzer suchen (E-Mail oder Name)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          {filteredUsers.length === 0 && (
            <caption className="py-8 text-center text-slate-400">
              Keine Benutzer gefunden, die Ihrer Suche entsprechen.
            </caption>
          )}
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Benutzer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rolle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">2FA Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Letzter Login</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className='font-bold text-slate-600'>{user.email.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{user.username || 'N/A'}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    value={user.role}
                    onChange={(e) => {
                      const selectedRole = e.target.value as UserRole;
                      if (selectedRole !== user.role) {
                        setRoleChangeState({isOpen: true, user: user, newRole: selectedRole});
                      }
                    }}
                    className="text-xs p-1 rounded-md border-slate-300 bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Rolle ändern...</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="IT_PROVIDER">IT_PROVIDER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {user.mfaSecret ? (
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Aktiviert (TOTP)
                            </span>
                            <button 
                                onClick={() => {
                                    setUserForMfaReset(user);
                                    setMfaResetDialogOpen(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            E-Mail (Standard)
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {user.isLocked ? (
                        <span className='inline-flex items-center gap-1.5 text-xs text-red-700'>
                            <Lock size={12} /> Gesperrt
                        </span>
                    ) : (
                        <span className='inline-flex items-center gap-1.5 text-xs text-green-700'>
                            <Unlock size={12} /> Aktiv
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nie'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => {
                    setUserForLock(user);
                    setLockDialogOpen(true);
                  }}
                    className={`p-2 rounded-md ${user.isLocked ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-100 hover:bg-red-200'}`}
                  >
                    {user.isLocked ? <Unlock size={16} className="text-gray-600"/> : <Lock size={16} className="text-red-600"/>}
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

export default AdminPage;
