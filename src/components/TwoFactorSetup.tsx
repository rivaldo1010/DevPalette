import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Download, Copy, CheckCircle, AlertTriangle, QrCode, Smartphone, X } from 'lucide-react';
import QRCode from 'qrcode';
import { User } from '../types/auth';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorSetupProps {
  user: User;
  onSetupComplete: (secret: string, verificationCode: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ 
  user, 
  onSetupComplete, 
  onClose 
}) => {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState<number | null>(null);

  const generateTwoFactorSetup = useCallback(async () => {
    try {
      // Generar un secreto aleatorio (simulado)
      const secret = generateRandomSecret();
      
      // Generar códigos de respaldo
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      // Crear URL para Google Authenticator
      const issuer = 'DevPalette';
      const accountName = user.email;
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

      // Generar código QR
      const qrCode = await QRCode.toDataURL(otpAuthUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF'
        }
      });

      const setupData: TwoFactorSetup = {
        secret,
        qrCodeUrl: otpAuthUrl,
        backupCodes
      };

      setSetup(setupData);
      setQrCodeImage(qrCode);
    } catch (err) {
      console.error('Error generating 2FA setup:', err);
      setError('Error al generar la configuración de 2FA');
    }
  }, [user.email]);

  useEffect(() => {
    generateTwoFactorSetup();
  }, [generateTwoFactorSetup]);

  const generateRandomSecret = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup', index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else if (type === 'backup' && index !== undefined) {
        setCopiedBackup(index);
        setTimeout(() => setCopiedBackup(null), 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const downloadBackupCodes = () => {
    if (!setup) return;
    
    const content = `DevPalette - Códigos de Respaldo 2FA
Fecha: ${new Date().toLocaleDateString()}
Usuario: ${user.email}

IMPORTANTE: Guarda estos códigos en un lugar seguro. Cada código solo se puede usar una vez.

${setup.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Notas:
- Usa estos códigos si pierdes acceso a tu aplicación de autenticación
- Cada código solo se puede usar una vez
- Genera nuevos códigos si usas todos estos
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devpalette-backup-codes-${user.email}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVerification = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onSetupComplete(setup!.secret, verificationCode);
      
      if (result.success) {
        setStep('backup');
      } else {
        setError(result.error || 'Código de verificación incorrecto');
      }
    } catch {
      setError('Error al verificar el código');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSecret = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  if (!setup) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Generando configuración 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">
              Configurar Autenticación de Dos Pasos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {step === 'setup' && (
            <div className="p-6 space-y-6">
              {/* Instrucciones */}
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-400 font-semibold text-sm mb-1">
                      Paso 1: Instala una aplicación de autenticación
                    </h3>
                    <p className="text-blue-200 text-sm">
                      Descarga Google Authenticator, Authy, o Microsoft Authenticator en tu dispositivo móvil.
                    </p>
                  </div>
                </div>
              </div>

              {/* Código QR */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Escanea este código QR
                </h3>
                <div className="inline-block bg-white p-4 rounded-lg">
                  <img src={qrCodeImage} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  Abre tu aplicación de autenticación y escanea el código QR
                </p>
              </div>

              {/* Configuración manual */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <QrCode className="w-4 h-4" />
                  <span>¿No puedes escanear? Configuración manual</span>
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nombre de la cuenta:</label>
                    <div className="bg-gray-800 rounded p-2 text-white font-mono text-sm">
                      {user.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Clave secreta:</label>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-800 rounded p-2 text-white font-mono text-sm flex-1">
                        {formatSecret(setup.secret)}
                      </div>
                      <button
                        onClick={() => copyToClipboard(setup.secret, 'secret')}
                        className="p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                        title="Copiar clave secreta"
                      >
                        {copiedSecret ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tipo:</label>
                    <div className="bg-gray-800 rounded p-2 text-white font-mono text-sm">
                      Basado en tiempo (TOTP)
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('verify')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Continuar con la verificación
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Verifica tu configuración
                </h3>
                <p className="text-gray-400 mb-6">
                  Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    if (error) setError('');
                  }}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-purple-500 focus:outline-none"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleVerification}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    'Verificar código'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  ¡2FA configurado correctamente!
                </h3>
                <p className="text-gray-400">
                  Guarda estos códigos de respaldo en un lugar seguro
                </p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-sm mb-1">
                      Códigos de respaldo importantes
                    </h3>
                    <p className="text-yellow-200 text-sm">
                      Estos códigos te permitirán acceder a tu cuenta si pierdes tu dispositivo. Cada código solo se puede usar una vez.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold">Códigos de respaldo</h4>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {setup.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="bg-gray-800 rounded p-2 text-white font-mono text-sm flex-1">
                        {code}
                      </div>
                      <button
                        onClick={() => copyToClipboard(code, 'backup', index)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        title={`Copiar código ${index + 1}`}
                      >
                        {copiedBackup === index ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('complete');
                  onClose();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Finalizar configuración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
