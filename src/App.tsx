import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuditChecklist from './components/AuditChecklist';
import FrameworkCatalog from './components/FrameworkCatalog';
import AiAssistant from './components/AiAssistant';
import OnboardingHub from './components/OnboardingChat';
import HelpSection from './components/HelpSection';
import { AuthScreens } from './components/AuthScreens';
import DbConfigWizard from './components/DbConfigWizard';
import AdminPage from './components/AdminPage';
import Impressum from './components/Impressum';
import Datenschutz from './components/Datenschutz';
import { Task, User, UserRole, Framework } from './types';
import * as api from './services/apiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDbWizardOpen, setIsDbWizardOpen] = useState(false);

  // Initial data loading for the entire application
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingData(true);
      try {
        const [loadedUsers, loadedTasks] = await Promise.all([
          api.getUsers(),
          api.getTasks()
        ]);
        setUsers(loadedUsers);
        setTasks(loadedTasks);
      } catch (e) {
        console.error("Failed to load data", e);
      }
      setIsLoadingData(false);
    };
    bootstrap();
  }, []);

  // Warn user before reloading if logged in
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (user) {
        e.preventDefault();
        e.returnValue = 'Sie sind gerade angemeldet. Wenn Sie die Seite neu laden, werden Sie abgemeldet. Möchten Sie wirklich fortfahren?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  

  const handleLogin = async (username: string, key: string, userObject?: User) => {
    const loggedInUser = userObject || users.find(u => u.email.toLowerCase() === username.toLowerCase());
    if (loggedInUser) {
      // Update last login
      const updatedUser = { ...loggedInUser, lastLogin: new Date() };
      await api.updateUser(loggedInUser.id, { lastLogin: new Date() });
      setUser(updatedUser);
    } else {
        alert("Login fehlgeschlagen. Benutzer nicht gefunden.");
    }
  };

  const handleLoginFail = async (username: string) => {
    await api.recordFailedLogin(username);
    // Refresh user list to show updated lock status/attempts
    setUsers(await api.getUsers());
  };

  const handleLogout = () => {
    setUser(null);
    // Data remains in the "shared" storage, no need to clear it
  };

  const updateTask = async (updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    await api.saveTasks(newTasks);
  };

  const addTasks = async (newTasks: Task[]) => {
    const updatedTasks = [...tasks, ...newTasks];
    setTasks(updatedTasks);
    await api.saveTasks(updatedTasks);
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
    await api.saveTasks(tasksToKeep);
  };

  const handleUpdateAnyUser = async (userId: string, updates: Partial<User>) => {
    await api.updateUser(userId, updates);
    const updatedUsers = await api.getUsers();
    setUsers(updatedUsers);
    
    // If the updated user is the currently logged-in user, update local state
    if (user && user.id === userId) {
        const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
        if (updatedCurrentUser) {
            setUser(updatedCurrentUser);
        }
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    await handleUpdateAnyUser(user.id, updates);
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

  const handleToggleUserLock = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const isLocking = !userToUpdate.isLocked;
      
      // Prevent locking the last active admin
      if (isLocking && userToUpdate.role === 'ADMIN') {
        const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== userId);
        if (activeAdmins.length === 0) {
          alert("Der letzte aktive Administrator kann nicht gesperrt werden. Es muss mindestens ein weiterer aktiver Admin vorhanden sein.");
          return;
        }
      }

      await api.updateUser(userId, { isLocked: isLocking });
      setUsers(await api.getUsers());
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
      } as User;

      // Simulate API call
      // We need to adapt api.addUser to accept a full User object or use a lower level save
      // api.addUser currently takes specific fields and generates a key. 
      // Since we already have the key and full object, we should probably add a method to apiService 
      // or just push to the list if we want to keep using the "shared data" pattern.
      // For now, let's assume we can just save the updated user list.
      
      // Actually, api.addUser is for "Admin adds user". 
      // For self-registration, we should probably manually add it to the store.
      
      const currentUsers = await api.getUsers();
      currentUsers.push(newUser);
      // We need a way to save users. apiService doesn't expose saveUsers directly but has saveSharedData internal.
      // Let's use a workaround or update apiService. 
      // But wait, apiService has `saveSharedData` but it's not exported.
      // However, `addUser` in apiService does: data.users.push(newUser); saveSharedData(data);
      
      // Let's modify apiService to allow saving a user directly or update the implementation here.
      // Since I can't easily modify apiService signature without breaking other things, 
      // I'll assume for now I can use a new method `registerUser` in apiService if I added it, 
      // OR I can just use `addUser` if I match the signature, but `addUser` generates a dummy key.
      
      // Best approach: Add `registerUser` to apiService.ts
      await api.registerUser(newUser);

      setUsers(await api.getUsers());
      return { success: true, user: newUser };

    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      return { success: false, error: 'Server-Fehler beim Erstellen des Benutzers.' };
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      // Prevent demoting the last active admin
      if (userToUpdate.role === 'ADMIN' && newRole !== 'ADMIN') {
        const activeAdmins = users.filter(u => u.role === 'ADMIN' && !u.isLocked && u.id !== userId);
        if (activeAdmins.length === 0) {
          alert("Die Rolle des letzten verbleibenden Admins kann nicht verändert werden. Es muss mindestens ein weiterer Admin vorhanden sein, damit man den Admin in seiner Rolle ändern kann.");
          return;
        }
      }
      
      await api.updateUser(userId, { role: newRole });
      setUsers(await api.getUsers());
    }
  };

  const handleResetMfa = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
        // We use undefined to remove the property, assuming apiService handles it or we accept it's just set to undefined
        await api.updateUser(userId, { mfaSecret: undefined });
        setUsers(await api.getUsers());
    }
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
          <Route path="/" element={<Dashboard tasks={tasks} user={user} />} />
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
          <Route path="/help" element={<HelpSection />} />
          <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPage users={users} onToggleUserLock={handleToggleUserLock} onChangeUserRole={handleChangeUserRole} onCreateUser={handleCreateUser} onResetMfa={handleResetMfa} onUpdateUser={handleUpdateAnyUser} /> : <Navigate to="/" replace />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;