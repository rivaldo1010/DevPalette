import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Palette } from 'lucide-react';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { TwoFactorVerification } from './TwoFactorVerification';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string | Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresTwoFactor?: boolean; user?: StoredUser }>;
  onRegister: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onPasswordReset?: (email: string, newPassword: string, code: string) => Promise<{ success: boolean; error?: string }>;
  onVerifyTwoFactor?: (user: StoredUser, code: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onRegister, onPasswordReset, onVerifyTwoFactor }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorUser, setTwoFactorUser] = useState<StoredUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    celular: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await onLogin(formData.email, formData.password);
        
        // Check if 2FA is required
        if (!result.success && result.requiresTwoFactor && result.user) {
          setTwoFactorUser(result.user);
          setShowTwoFactor(true);
          setIsLoading(false);
          return;
        }
      } else {
        if (!formData.name.trim()) {
          setError('El nombre es requerido');
          setIsLoading(false);
          return;
        }
        if (!formData.email.trim() && !formData.celular.trim()) {
          setError('Debes ingresar al menos un correo electrónico o un celular');
          setIsLoading(false);
          return;
        }
        result = await onRegister(formData.name, formData.email, formData.password);
      }

      if (!result.success) {
        setError(result.error || 'Error desconocido');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerify = async (code: string) => {
    if (!twoFactorUser || !onVerifyTwoFactor) {
      return { success: false, error: 'Error de configuración' };
    }

    return await onVerifyTwoFactor(twoFactorUser, code);
  };

  const handleTwoFactorBack = () => {
    setShowTwoFactor(false);
    setTwoFactorUser(null);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handlePasswordReset = async (email: string, newPassword: string, code: string) => {
    if (onPasswordReset) {
      return await onPasswordReset(email, newPassword, code);
    }
    return { success: false, error: 'Funcionalidad no disponible' };
  };

  // Show two factor verification form
  if (showTwoFactor && twoFactorUser) {
    return (
      <TwoFactorVerification
        onVerify={handleTwoFactorVerify}
        onBack={handleTwoFactorBack}
        userEmail={twoFactorUser.email}
        isLoading={isLoading}
      />
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        onBack={() => setShowForgotPassword(false)}
        onPasswordReset={handlePasswordReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Palette className="w-10 h-10 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DevPalette
            </h1>
          </div>
          <p className="text-gray-400">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Tu nombre completo"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico (opcional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Celular (opcional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Ej: 5512345678"
                    pattern="[0-9]{10,15}"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Tu contraseña"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isLogin ? 'Iniciando sesión...' : 'Registrando...'}</span>
                </div>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Registrarse'
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Toggle between login and register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ name: '', email: '', password: '', celular: '' });
                }}
                className="ml-2 text-purple-400 hover:text-purple-300 font-medium"
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Credenciales de prueba:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p><strong>Email:</strong> demo@devpalette.com</p>
            <p><strong>Contraseña:</strong> demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
};