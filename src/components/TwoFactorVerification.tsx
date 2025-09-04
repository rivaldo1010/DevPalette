import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';

interface TwoFactorVerificationProps {
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
  userEmail: string;
  isLoading?: boolean;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  onVerify,
  onBack,
  userEmail,
  isLoading = false
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newCode = digits.split('');
      setCode(newCode);
      setError('');
      handleVerify(digits);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (verificationCode.length !== 6) {
      setError('Por favor, ingresa un código de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await onVerify(verificationCode);
      if (!result.success) {
        setError(result.error || 'Código de verificación inválido');
        // Clear the code on error
        setCode(['', '', '', '', '', '']);
        // Focus first input
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Error al verificar el código');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = () => {
    const fullCode = code.join('');
    handleVerify(fullCode);
  };

  const isCodeComplete = code.every(digit => digit !== '');
  const isDisabled = isLoading || isVerifying;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Verificación en dos pasos
          </h1>
          <p className="text-gray-400">
            Ingresa el código de 6 dígitos de tu aplicación autenticadora
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Iniciando sesión como: <span className="text-purple-400">{userEmail}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
              Código de verificación
            </label>
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isDisabled}
                  className="w-12 h-12 text-center text-xl font-bold bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="•"
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-500 rounded-lg p-3 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleManualSubmit}
            disabled={!isCodeComplete || isDisabled}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed mb-4"
          >
            {isVerifying ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verificando...</span>
              </div>
            ) : (
              'Verificar código'
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={onBack}
            disabled={isDisabled}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {/* Help */}
        <div className="mt-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            ¿No puedes acceder a tu código?
          </h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Verifica que la hora de tu dispositivo sea correcta</p>
            <p>• Busca el código en Google Authenticator o tu app de autenticación</p>
            <p>• Si tienes códigos de respaldo, puedes usarlos</p>
          </div>
        </div>
      </div>
    </div>
  );
};
