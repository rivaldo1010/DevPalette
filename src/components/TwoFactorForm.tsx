import React, { useState, useEffect } from 'react';
import { Mail, Shield, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface TwoFactorFormProps {
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  email: string;
  codeSent: string;
  onResendCode: () => void;
  onCancel: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ 
  onVerify, 
  email, 
  codeSent, 
  onResendCode,
  onCancel 
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const maxAttempts = 3;

  useEffect(() => {
    // Marcar que el email fue enviado al cargar el componente
    setEmailSent(true);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const result = await onVerify(code);
    
    if (!result.success) {
      setAttempts(prev => prev + 1);
      
      if (attempts + 1 >= maxAttempts) {
        setError('Demasiados intentos fallidos. Por favor, solicita un nuevo código.');
        setCanResend(true);
      } else {
        setError(`Código incorrecto. Te quedan ${maxAttempts - attempts - 1} intentos.`);
      }
      setCode('');
    }
    
    setIsLoading(false);
  };

  const handleResendCode = () => {
    onResendCode();
    setTimeLeft(300);
    setCanResend(false);
    setAttempts(0);
    setError('');
    setCode('');
    setEmailSent(true);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Verificación 2FA
            </h1>
          </div>
          <p className="text-gray-400 mb-2">
            Por tu seguridad, necesitamos verificar tu identidad
          </p>
        </div>

        {/* Security Alert */}
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold text-sm mb-1">
                ¿Eres tú quien está intentando iniciar sesión?
              </h3>
              <p className="text-yellow-200 text-xs">
                Si no reconoces este intento de acceso, cancela inmediatamente y cambia tu contraseña.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          {/* Email Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-900 rounded-lg">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-300">Código enviado a:</p>
              <p className="font-semibold text-white">{email}</p>
            </div>
          </div>

          {/* Email Sent Confirmation */}
          {emailSent && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="text-green-400 font-semibold text-sm">¡Código enviado!</h3>
                  <p className="text-green-200 text-xs mt-1">
                    Hemos enviado un código de 6 dígitos a tu correo electrónico. 
                    Revisa tu bandeja de entrada y carpeta de spam.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de verificación
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-purple-500 focus:outline-none"
                placeholder="000000"
                maxLength={6}
                disabled={isLoading || attempts >= maxAttempts}
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                Ingresa el código de 6 dígitos
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Timer and Attempts */}
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-400">
                {timeLeft > 0 ? (
                  <span>Código válido por: <span className="font-mono text-purple-400">{formatTime(timeLeft)}</span></span>
                ) : (
                  <span className="text-red-400">Código expirado</span>
                )}
              </div>
              <div className="text-gray-400">
                Intentos: <span className={attempts >= maxAttempts ? 'text-red-400' : 'text-white'}>{attempts}/{maxAttempts}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6 || attempts >= maxAttempts || timeLeft === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : (
                'Verificar Código'
              )}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">¿No recibiste el código?</p>
              <button
                onClick={handleResendCode}
                disabled={!canResend && timeLeft > 0}
                className="flex items-center space-x-2 mx-auto text-purple-400 hover:text-purple-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reenviar código</span>
              </button>
              {!canResend && timeLeft > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Disponible en {formatTime(timeLeft)}
                </p>
              )}
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-4">
            <button
              onClick={onCancel}
              className="w-full text-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancelar y volver al inicio de sesión
            </button>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Consejos de seguridad:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Nunca compartas tu código de verificación con nadie</li>
            <li>• El código expira en 5 minutos por seguridad</li>
            <li>• Si no solicitaste este código, cambia tu contraseña inmediatamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};