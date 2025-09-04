import React, { useState, useRef } from 'react';
import { User, Heart, Camera, Save, X, Mail, Calendar, Palette } from 'lucide-react';
import { User as UserType } from '../types/auth';
import { Color } from '../types/color';
import { ColorCard } from './ColorCard';

interface ProfilePageProps {
  user: UserType;
  favoriteColors: Color[];
  onToggleFavorite: (id: string) => void;
  onDeleteColor: (id: string) => void;
  onRenameColor: (id: string, newName: string) => void;
  onUpdateProfile: (updates: Partial<UserType>) => void;
  onClose: () => void;
  onDeleteAccount: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  favoriteColors,
  onToggleFavorite,
  onDeleteColor,
  onRenameColor,
  onUpdateProfile,
  onClose,
  onDeleteAccount
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user.name,
    email: user.email
  });
  const [profileImage, setProfileImage] = useState<string | null>(
    localStorage.getItem(`profile-image-${user.id}`) || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setProfileImage(imageData);
      localStorage.setItem(`profile-image-${user.id}`, imageData);
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    localStorage.removeItem(`profile-image-${user.id}`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = () => {
    if (!editData.name.trim() || !editData.email.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    onUpdateProfile({
      name: editData.name.trim(),
      email: editData.email.trim()
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditData({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <User className="w-6 h-6 text-purple-400" />
            <span>Mi Perfil</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Cerrar perfil"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-8">
            {/* Profile Info Section */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-start space-x-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-700 p-2 rounded-full transition-colors"
                      title="Cambiar imagen de perfil"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                    {profileImage && (
                      <button
                        onClick={removeProfileImage}
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full transition-colors"
                        title="Eliminar imagen de perfil"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    title="Selecciona una imagen de perfil"
                    placeholder="Selecciona una imagen de perfil"
                  />
                </div>

                {/* User Info */}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          title="Nombre completo"
                          placeholder="Ingresa tu nombre completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          title="Correo electrónico"
                          placeholder="Ingresa tu correo electrónico"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Guardar</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                        <div className="flex items-center space-x-2 text-gray-400 mt-1">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>Miembro desde {formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Editar Perfil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{favoriteColors.length}</div>
                <div className="text-sm text-gray-400">Colores Favoritos</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-pink-400">0</div>
                <div className="text-sm text-gray-400">Paletas Creadas</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-sm text-gray-400">Proyectos</div>
              </div>
            </div>

            {/* Favorite Colors Section */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="w-6 h-6 text-red-400 fill-current" />
                <h3 className="text-xl font-bold text-white">Mis Colores Favoritos</h3>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-300">
                  {favoriteColors.length}
                </span>
              </div>

              {favoriteColors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteColors.map((color) => (
                    <ColorCard
                      key={color.id}
                      color={color}
                      onToggleFavorite={onToggleFavorite}
                      onDelete={onDeleteColor}
                      onRename={onRenameColor}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-900 rounded-xl">
                  <Palette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-400 mb-2">
                    No tienes colores favoritos
                  </h4>
                  <p className="text-gray-500">
                    Marca algunos colores como favoritos para verlos aquí
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      {/* Delete Account Section */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas borrar tu cuenta? Esta acción no se puede deshacer.')) {
                    onDeleteAccount();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                Borrar cuenta
              </button>
            </div>
      </div>
    </div>
  );
};