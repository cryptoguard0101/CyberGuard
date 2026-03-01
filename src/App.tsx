import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuditChecklist from './components/AuditChecklist';
import FrameworkCatalog from './components/FrameworkCatalog';
import AiAssistant from './components/AiAssistant';
import OnboardingHub from './components/OnboardingChat';
import UserManagement from './components/UserManagement';
import HelpSection from './components/HelpSection';
import { AuthScreens } from './components/AuthScreens';
import DbConfigWizard from './components/DbConfigWizard';
import Settings from './components/Settings';
import AdminPage from './components/AdminPage';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import { Task, User, UserRole, Framework } from './types';
// import * as api from './services/apiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDbWizardOpen, setIsDbWizardOpen] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Initial data loading for the entire application
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingData(true);
      const [loadedUsers, loadedTasks] = await Promise.all([
        Promise.resolve([]),
        Promise.resolve([])
      ]);
      setUsers(loadedUsers);
      setTasks(loadedTasks);
      setIsLoadingData(false);
    };
    bootstrap();
  }, []);

  

  const handleLogin = async (username: string, key: string, userObject?: User) => {
    const loggedInUser = userObject || users.find(u => u.email === username);
    if (loggedInUser) {
      loggedInUser.lastLogin = new Date();
      setUser(loggedInUser);
    } else {
        alert("Login fehlgeschlagen. Benutzer nicht gefunden.");
    }
  };

  const handleLoginFail = async () => {
    // await api.recordFailedLogin(username);
    // Refresh user list to show updated lock status/attempts
    // setUsers(await api.getUsers());
  };

  const handleLogout = () => {
    setUser(null);
    // Data remains in the "shared" storage, no need to clear it
  };

  const updateTask = async (updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    // await api.saveTasks(newTasks);
  };

  const addTasks = async (newTasks: Task[]) => {
    const updatedTasks = [...tasks, ...newTasks];
    setTasks(updatedTasks);
    // await api.saveTasks(updatedTasks);
  };
  
  const handleRemoveModule = async (moduleId: string) => {
    // Map moduleId back to Framework enum
    const frameworkMap: Record<string, Framework> = {
      'nis2': Framework.NIS2,
      'iso27001': Framework.ISO27001,
      'bsi': Framework.BSI,
      'gdpr': Framework.GDPR,
      'cis': Framework.CIS
    };
    
    const frameworkToRemove = frameworkMap[moduleId];
    if (!frameworkToRemove) return;

    const tasksToKeep = tasks.filter(t => t.framework !== frameworkToRemove);
    setTasks(tasksToKeep);
    // await api.saveTasks(tasksToKeep);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    // await api.updateUser(user.id, updates);
    // setUsers(await api.getUsers());
  };

  // User Management Handlers
  /*
  const handleAddUser = async (_username: string, _email: string, _role: UserRole, _validUntil: Date | null) => {
    // await api.addUser({ username, email, role, validUntil });
    // setUsers(await api.getUsers());
  };

  const handleUpdateUserList = async (_id: string, _updates: Partial<User>) => {
    // await api.updateUser(id, updates);
    // setUsers(await api.getUsers());
  };

  const handleRemoveUser = async (_id: string) => {
    // await api.deleteUser(id);
    // setUsers(await api.getUsers());
  };
  */

  const handleToggleUserLock = (userId: string) => {
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, isLocked: !u.isLocked } : u
    );
    setUsers(updatedUsers);
    const userToUpdate = updatedUsers.find(u => u.id === userId);
    if (userToUpdate) {
      // api.updateUser(userId, { isLocked: userToUpdate.isLocked });
    }
  };

  const handleCreateUser = async (userData: Partial<User>): Promise<{success: boolean, error?: string, user?: User}> => {
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email?.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' };
    }

    try {
      // In a real app, this would be a more complex object creation
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: userData.email!,
        username: userData.username!,
        role: userData.role!,
        encryptionKey: userData.encryptionKey!,
        ...userData,
        lastLogin: new Date(),
        isLocked: false,
        // mfaSecret: '', // Should be generated server-side
        // passkeyCredential: '', // Should be generated server-side
      } as User;

      // Simulate API call
      // await api.addUser(newUser);

      setUsers(prevUsers => [...prevUsers, newUser]);
      return { success: true, user: newUser };

    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      return { success: false, error: 'Server-Fehler beim Erstellen des Benutzers.' };
    }
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    setUsers(updatedUsers);
    // api.updateUser(userId, { role: newRole });
  };

  if (isLoadingData && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Lade Anwendung...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <AuthScreens 
            onLogin={handleLogin} 
            onLoginFail={handleLoginFail}
            onRegister={handleCreateUser}
            users={users} 
        />
    );
  }

  return (
    <HashRouter>
      <DbConfigWizard isOpen={isDbWizardOpen} onClose={() => setIsDbWizardOpen(false)} />
      <Layout user={user} tasks={tasks} onLogout={handleLogout} onUpdateUser={handleUpdateUser}>
        <Routes>
          <Route path="/" element={<Dashboard tasks={tasks} user={user} isLocalMode={isLocalMode} />} />
          <Route 
            path="/onboarding"
            element={<OnboardingHub user={user} onAddTasks={addTasks} tasks={tasks} onUpdateUser={handleUpdateUser} />}
          />
          <Route 
            path="/audit" 
            element={<AuditChecklist tasks={tasks} user={user} onUpdateTask={updateTask} />} 
          />
          <Route 
            path="/catalog" 
            element={<FrameworkCatalog onAddTasks={addTasks} tasks={tasks} onRemoveModule={handleRemoveModule} />} 
          />
          <Route path="/assistant" element={<AiAssistant />} />
          <Route 
            path="/users" 
            element={
                <UserManagement 
                    users={users} 
                />
            } 
          />
          <Route path="/help" element={<HelpSection />} />
          <Route path="/settings" element={<Settings isLocalMode={isLocalMode} onToggleLocalMode={() => setIsLocalMode(!isLocalMode)} />} />
          <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPage users={users} onToggleUserLock={handleToggleUserLock} onChangeUserRole={handleChangeUserRole} onCreateUser={handleCreateUser} /> : <Navigate to="/" replace />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;