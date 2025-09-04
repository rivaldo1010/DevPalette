import React, { useState } from 'react';
import { User, LogOut, ChevronDown, UserCircle, Shield } from 'lucide-react';
import { User as UserType } from '../types/auth';

interface UserMenuProps {
  user: UserType;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenTwoFactor: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onOpenProfile, onOpenTwoFactor }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const profileImage = localStorage.getItem(`profile-image-${user.id}`);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-gray-700">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>Mi Perfil</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenTwoFactor();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Verificación 2FA</span>
              {user.twoFactorEnabled && (
                <span className="ml-auto text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  Activo
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};