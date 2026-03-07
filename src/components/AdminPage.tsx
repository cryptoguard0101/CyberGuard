import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { UserCog, Lock, Unlock, Search, UserPlus, Edit } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import NewUserDialog from './NewUserDialog';

interface AdminPageProps {
  users: User[];
  onToggleUserLock: (userId: string) => void;
  onChangeUserRole: (userId: string, newRole: UserRole) => void;
  onCreateUser: (userData: Omit<User, 'id' | 'lastLogin' | 'isLocked' | 'mfaSecret' | 'passkeyCredential'> & { password?: string }) => Promise<{success: boolean, error?: string}>;
  onResetMfa: (userId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ users, onToggleUserLock, onChangeUserRole, onCreateUser, onResetMfa, onUpdateUser }) => {
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [userForLock, setUserForLock] = useState<User | null>(null);
  
  const [mfaResetDialogOpen, setMfaResetDialogOpen] = useState(false);
  const [userForMfaReset, setUserForMfaReset] = useState<User | null>(null);

  const [roleChangeState, setRoleChangeState] = useState<{isOpen: boolean, user: User | null, newRole: UserRole | null}>({isOpen: false, user: null, newRole: null});
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');

  const handleEditUser = (user: User) => {
      setUserToEdit(user);
      setEditUsername(user.username || '');
      setEditUserDialogOpen(true);
  };

  const saveUserEdit = () => {
      if (userToEdit) {
          onUpdateUser(userToEdit.id, { username: editUsername });
          setEditUserDialogOpen(false);
          setUserToEdit(null);
      }
  };

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
            <h1 className="text-2xl font-bold text-slate-900">Benutzerverwaltung</h1>
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
            // Check if trying to lock the last active admin
            if (!userForLock.isLocked && userForLock.role === 'ADMIN') {
                const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== userForLock.id);
                if (activeAdmins.length === 0) {
                    alert("Der letzte aktive Administrator kann nicht gesperrt werden, um den Zugriff auf das System zu gewährleisten.");
                    setLockDialogOpen(false);
                    return;
                }
            }
            onToggleUserLock(userForLock.id);
            setLockDialogOpen(false);
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
            // Check if trying to demote the last active admin
            if (roleChangeState.user.role === 'ADMIN' && roleChangeState.newRole !== 'ADMIN') {
                const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== roleChangeState.user.id);
                if (activeAdmins.length === 0) {
                    alert("Die Rolle des letzten aktiven Administrators kann nicht geändert werden.");
                    setRoleChangeState({isOpen: false, user: null, newRole: null});
                    return;
                }
            }
            onChangeUserRole(roleChangeState.user.id, roleChangeState.newRole);
            setRoleChangeState({isOpen: false, user: null, newRole: null});
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

      {/* Edit User Dialog */}
      {editUserDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Benutzer bearbeiten</h3>
                    <p className="text-sm text-slate-500">Ändern Sie die Details für {userToEdit?.email}</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Anzeigename</label>
                        <input 
                            type="text" 
                            value={editUsername} 
                            onChange={(e) => setEditUsername(e.target.value)}
                            placeholder="Name eingeben"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setEditUserDialogOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={saveUserEdit}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        </div>
      )}

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
                  <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => handleEditUser(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all font-semibold"
                        title="Benutzer bearbeiten"
                    >
                        <Edit size={14} />
                        <span>Bearbeiten</span>
                    </button>
                    <button 
                        onClick={() => {
                        setUserForLock(user);
                        setLockDialogOpen(true);
                    }}
                        className={`p-2 rounded-lg border transition-all ${user.isLocked ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100'}`}
                        title={user.isLocked ? "Entsperren" : "Sperren"}
                    >
                        {user.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  </div>
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
