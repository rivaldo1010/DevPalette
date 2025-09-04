import React, { useState } from 'react';
import { Shield, X, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { User } from '../types/auth';

interface TwoFactorManagerProps {
  user: User;
  onSetupTwoFactor: () => void;
  onDisableTwoFactor: () => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const TwoFactorManager: React.FC<TwoFactorManagerProps> = ({
  user,
  onSetupTwoFactor,
  onDisableTwoFactor,
  onClose
}) => {
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState('');

  const handleDisable = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar la autenticación de dos pasos? Tu cuenta será menos segura.')) {
      return;
    }

    setIsDisabling(true);
    setError('');

    try {
      const result = await onDisableTwoFactor();
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Error al desactivar 2FA');
      }
    } catch {
      setError('Error al desactivar 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">
              Autenticación de Dos Pasos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className={`rounded-lg p-4 ${
            user.twoFactorEnabled 
              ? 'bg-green-900/30 border border-green-600' 
              : 'bg-yellow-900/30 border border-yellow-600'
          }`}>
            <div className="flex items-start space-x-3">
              {user.twoFactorEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className={`font-semibold text-sm mb-1 ${
                  user.twoFactorEnabled ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {user.twoFactorEnabled ? '2FA Activado' : '2FA Desactivado'}
                </h3>
                <p className={`text-sm ${
                  user.twoFactorEnabled ? 'text-green-200' : 'text-yellow-200'
                }`}>
                  {user.twoFactorEnabled 
                    ? 'Tu cuenta está protegida con autenticación de dos pasos.' 
                    : 'Tu cuenta no tiene protección adicional activada.'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Benefits */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">¿Por qué usar 2FA?</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Protege tu cuenta incluso si tu contraseña es comprometida</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Funciona con Google Authenticator, Authy, y otras apps</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Códigos de respaldo para acceso de emergencia</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Estándar de seguridad recomendado por expertos</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {!user.twoFactorEnabled ? (
              <button
                onClick={() => {
                  onClose();
                  onSetupTwoFactor();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>Configurar 2FA</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onClose();
                    onSetupTwoFactor();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Regenerar códigos de respaldo
                </button>
                <button
                  onClick={handleDisable}
                  disabled={isDisabling}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isDisabling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Desactivando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Desactivar 2FA</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white transition-colors text-sm py-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
