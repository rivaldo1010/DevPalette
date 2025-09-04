import { useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string | Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('auth-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('auth-user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean; user?: StoredUser }> => {
    try {
      // Get users from localStorage
      const savedUsers = localStorage.getItem('auth-users');
      const users: StoredUser[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Find user
      const user = users.find((u: StoredUser) => u.email === email && u.password === password);
      
      if (!user) {
        return { success: false, error: 'Credenciales inválidas' };
      }

      // Check if user has 2FA enabled
      if (user.twoFactorEnabled) {
        return { 
          success: false, 
          requiresTwoFactor: true, 
          user: user 
        };
      }

      // Login without 2FA
      return await completeLogin(user);
    } catch {
      return { success: false, error: 'Error al iniciar sesión' };
    }
  };

  const verifyTwoFactorLogin = async (user: StoredUser, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // En una aplicación real, aquí verificarías el código TOTP con el servidor
      // Por ahora simulamos la verificación básica
      const isValidCode = code.length === 6 && /^\d+$/.test(code);
      
      if (!isValidCode) {
        return { success: false, error: 'Código de verificación inválido' };
      }

      // Simulamos validación del código TOTP
      // En una app real, usarías una librería como 'otpauth' para validar el TOTP
      if (code === '000000') {
        return { success: false, error: 'Código de prueba inválido. Usa tu app autenticadora.' };
      }

      // Complete login after successful 2FA verification
      return await completeLogin(user);
    } catch {
      return { success: false, error: 'Error al verificar el código 2FA' };
    }
  };

  const completeLogin = async (user: StoredUser): Promise<{ success: boolean; error?: string }> => {
    try {
      // Remove password from user object before storing
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = user;
      
      // Ensure createdAt is a Date object
      const userForState: User = {
        ...userWithoutPassword,
        createdAt: typeof userWithoutPassword.createdAt === 'string' 
          ? new Date(userWithoutPassword.createdAt) 
          : userWithoutPassword.createdAt
      };
      
      // Save user session
      localStorage.setItem('auth-user', JSON.stringify(userForState));
      
      setAuthState({
        user: userForState,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Error al completar el inicio de sesión' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get existing users
      const savedUsers = localStorage.getItem('auth-users');
      const users: StoredUser[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Check if user already exists
      if (users.find((u: StoredUser) => u.email === email)) {
        return { success: false, error: 'El usuario ya existe' };
      }

      // Create new user
      const newUser: StoredUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In a real app, this should be hashed
        createdAt: new Date()
      };

      // Save to users list
      users.push(newUser);
      localStorage.setItem('auth-users', JSON.stringify(users));

      // Remove password before storing in session
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userWithoutPassword } = newUser;
      
      const userForState: User = {
        ...userWithoutPassword,
        createdAt: new Date(userWithoutPassword.createdAt)
      };
      
      // Save user session
      localStorage.setItem('auth-user', JSON.stringify(userForState));
      
      setAuthState({
        user: userForState,
        isAuthenticated: true,
        isLoading: false
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Error al registrar usuario' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth-user');
    // Also remove profile image when logging out
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('profile-image-')) {
        localStorage.removeItem(key);
      }
    });
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get existing users
      const savedUsers = localStorage.getItem('auth-users');
      const users: StoredUser[] = savedUsers ? JSON.parse(savedUsers) : [];
      
      // Find user by email
      const userIndex = users.findIndex((u: StoredUser) => u.email === email);
      
      if (userIndex === -1) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Update password (in a real app, this should be hashed)
      users[userIndex].password = newPassword;
      
      // Save updated users list
      localStorage.setItem('auth-users', JSON.stringify(users));

      return { success: true };
    } catch {
      return { success: false, error: 'Error al restablecer la contraseña' };
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!authState.user) return;
    
    const updatedUser = { ...authState.user, ...updates };
    
    // Update in localStorage
    localStorage.setItem('auth-user', JSON.stringify(updatedUser));
    
    // Update users list
    const savedUsers = localStorage.getItem('auth-users');
    if (savedUsers) {
      const users: StoredUser[] = JSON.parse(savedUsers);
      const userIndex = users.findIndex((u: StoredUser) => u.id === authState.user!.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem('auth-users', JSON.stringify(users));
      }
    }
    
    setAuthState(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  const setupTwoFactor = async (secret: string, verificationCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // En una aplicación real, aquí verificarías el código con el servidor
      // Por ahora simulamos la verificación
      const isValidCode = verificationCode.length === 6 && /^\d+$/.test(verificationCode);
      
      if (!isValidCode) {
        return { success: false, error: 'Código de verificación inválido' };
      }

      // Guardar la configuración 2FA
      updateProfile({
        twoFactorEnabled: true,
        twoFactorSecret: secret
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Error al configurar 2FA' };
    }
  };

  const disableTwoFactor = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Desactivar 2FA
      updateProfile({
        twoFactorEnabled: false,
        twoFactorSecret: undefined
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Error al desactivar 2FA' };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!authState.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Eliminar usuario de la lista
      const savedUsers = localStorage.getItem('auth-users');
      if (savedUsers) {
        const users: StoredUser[] = JSON.parse(savedUsers);
        const filteredUsers = users.filter((u: StoredUser) => u.id !== authState.user!.id);
        localStorage.setItem('auth-users', JSON.stringify(filteredUsers));
      }

      // Cerrar sesión y limpiar datos
      logout();

      return { success: true };
    } catch {
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    setupTwoFactor,
    disableTwoFactor,
    deleteAccount,
    verifyTwoFactorLogin
  };
};