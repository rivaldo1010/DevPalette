import React, { useState } from 'react';
import { Mail, ArrowLeft, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { EmailService } from './EmailService';

interface ForgotPasswordFormProps {
  onBack: () => void;
  onPasswordReset: (email: string, newPassword: string, code: string) => Promise<{ success: boolean; error?: string }>;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, onPasswordReset }) => {
  const [step, setStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email');
  const [method, setMethod] = useState<'email' | 'celular'>('email');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Buscar usuario por método seleccionado
      const savedUsers = localStorage.getItem('auth-users');
      const users = savedUsers ? JSON.parse(savedUsers) : [];
      let userExists;
      if (method === 'email') {
        if (!EmailService.isValidEmail(email)) {
          setError('Por favor ingresa un correo electrónico válido');
          setIsLoading(false);
          return;
        }
        userExists = users.find((u: any) => u.email === email);
        if (!userExists) {
          setError('No encontramos una cuenta asociada a este correo electrónico');
          setIsLoading(false);
          return;
        }
      } else {
        if (!celular.match(/^[0-9]{10,15}$/)) {
          setError('Por favor ingresa un número de celular válido');
          setIsLoading(false);
          return;
        }
        userExists = users.find((u: any) => u.celular === celular);
        if (!userExists) {
          setError('No encontramos una cuenta asociada a este celular');
          setIsLoading(false);
          return;
        }
      }

      // Generar código de recuperación
      const resetCode = EmailService.generateSecureCode();
      setSentCode(resetCode);

      // Simular envío de código
      const emailService = EmailService.getInstance();
      let success = false;
      if (method === 'email') {
        success = await emailService.sendPasswordResetCode(email, resetCode, userExists.name);
      } else {
        // Aquí deberías integrar el envío de SMS real
        // Por ahora solo simula el envío
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('📱 Enviando código de recuperación por SMS...');
        console.log('Para:', celular);
        console.log('Código:', resetCode);
        success = Math.random() > 0.05;
      }

      if (success) {
        setStep('code');
        setTimeLeft(300); // 5 minutos
        // Iniciar contador regresivo
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError('Error al enviar el código. Inténtalo de nuevo.');
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code !== sentCode) {
      setError('Código incorrecto. Verifica e inténtalo de nuevo.');
      return;
    }

    if (timeLeft <= 0) {
      setError('El código ha expirado. Solicita uno nuevo.');
      return;
    }

    setStep('newPassword');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onPasswordReset(email, newPassword, sentCode);
      
      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEmailStep = () => (
    <form onSubmit={handleSendCode} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Selecciona el método de recuperación
        </label>
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${method === 'email' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setMethod('email')}
          >
            Correo electrónico
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${method === 'celular' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setMethod('celular')}
          >
            Celular
          </button>
        </div>
        {method === 'email' ? (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="tu@email.com"
                required={method === 'email'}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Te enviaremos un código de verificación a este correo
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Celular
            </label>
            <div className="relative">
              <input
                type="tel"
                value={celular}
                onChange={(e) => {
                  setCelular(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-4 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Ej: 5512345678"
                pattern="[0-9]{10,15}"
                required={method === 'celular'}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Te enviaremos un código de verificación a este celular
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || (method === 'email' ? !email : !celular)}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Enviando código...</span>
          </div>
        ) : (
          'Enviar código de recuperación'
        )}
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      {/* Demo Code Display */}
      {/* Email Sent Confirmation */}
      <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="text-green-400 font-semibold text-sm">¡Código enviado!</h3>
            <p className="text-green-200 text-xs mt-1">
              Hemos enviado un código de recuperación a tu correo electrónico. 
              Revisa tu bandeja de entrada y carpeta de spam.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Código de verificación
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(value);
            if (error) setError('');
          }}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-purple-500 focus:outline-none"
          placeholder="000000"
          maxLength={6}
        />
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-gray-400">
            Código enviado a: {method === 'email' ? email.replace(/(.{2}).*(@.*)/, '$1***$2') : celular.replace(/(.{2}).*/, '$1***')}
          </span>
          <span className={`font-mono ${timeLeft > 0 ? 'text-purple-400' : 'text-red-400'}`}>
            {timeLeft > 0 ? formatTime(timeLeft) : 'Expirado'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={code.length !== 6 || timeLeft <= 0}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        Verificar código
      </button>

      <button
        type="button"
        onClick={() => setStep('email')}
        className="w-full text-gray-400 hover:text-white transition-colors text-sm"
      >
        Volver a ingresar correo
      </button>
    </form>
  );

  const renderNewPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nueva contraseña
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (error) setError('');
          }}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          placeholder="Ingresa tu nueva contraseña"
          required
          minLength={6}
        />
        <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Confirmar contraseña
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError('');
          }}
          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          placeholder="Confirma tu nueva contraseña"
          required
        />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !newPassword || !confirmPassword}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Restableciendo...</span>
          </div>
        ) : (
          'Restablecer contraseña'
        )}
      </button>
    </form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
      <h3 className="text-xl font-bold text-white">¡Contraseña restablecida!</h3>
      <p className="text-gray-400">
        Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
      </p>
      <button
        onClick={onBack}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
      >
        Ir al inicio de sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Recuperar Contraseña
            </h1>
          </div>
          <p className="text-gray-400">
            {step === 'email' && 'Ingresa tu correo para recibir un código de recuperación'}
            {step === 'code' && 'Verifica el código que enviamos a tu correo'}
            {step === 'newPassword' && 'Crea una nueva contraseña segura'}
            {step === 'success' && 'Proceso completado exitosamente'}
          </p>
        </div>

        {/* Security Alert */}
        {step !== 'success' && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-yellow-400 font-semibold text-sm mb-1">
                  ¿Solicitaste restablecer tu contraseña?
                </h3>
                <p className="text-yellow-200 text-xs">
                  Si no solicitaste este cambio, ignora este proceso y asegúrate de que tu cuenta esté segura.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'newPassword' && renderNewPasswordStep()}
          {step === 'success' && renderSuccessStep()}

          {/* Back Button */}
          {step !== 'success' && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio de sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Tips */}
        {step !== 'success' && (
          <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Consejos de seguridad:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Usa una contraseña única y segura</li>
              <li>• No compartas tu código de recuperación con nadie</li>
              <li>• El código expira en 5 minutos por seguridad</li>
              <li>• Si no solicitaste esto, contacta al soporte</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};