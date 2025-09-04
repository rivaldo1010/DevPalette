import React, { useState, useMemo, useEffect } from 'react';
import { 
  Palette, 
  Heart, 
  Search, 
  Plus, 
  Download, 
  Upload,
  Grid,
  List,
  Settings,
  Trash2
} from 'lucide-react';
import { Color, ColorPalette } from './types/color';
import { ColorCard } from './components/ColorCard';
import { ColorPicker } from './components/ColorPicker';
import { ColorGenerator } from './components/ColorGenerator';
import { ProfilePage } from './components/ProfilePage';
import { LoginForm } from './components/LoginForm';
import { UserMenu } from './components/UserMenu';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { hexToRgb, rgbToHsl } from './utils/colorUtils';

import { TwoFactorSetup } from './components/TwoFactorSetup';
import { TwoFactorManager } from './components/TwoFactorManager';

function App() {
  // Asegura que la cuenta demo siempre exista
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('auth-users') || '[]');
    if (!users.find((u: { email: string }) => u.email === 'demo@devpalette.com')) {
      users.push({
        id: Date.now().toString(),
        name: 'Demo',
        email: 'demo@devpalette.com',
        password: 'demo123',
        createdAt: new Date()
      });
      localStorage.setItem('auth-users', JSON.stringify(users));
    }
  }, []);

  const { user, isAuthenticated, isLoading, login, register, logout, updateProfile, resetPassword, setupTwoFactor, disableTwoFactor, deleteAccount, verifyTwoFactorLogin } = useAuth();
  const [colors, setColors] = useLocalStorage<Color[]>('color-palette-colors', []);
  const [palettes, setPalettes] = useLocalStorage<ColorPalette[]>('color-palette-palettes', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newColorValue, setNewColorValue] = useState('#6366f1');
  const [newColorName, setNewColorName] = useState('');
  const [activeTab, setActiveTab] = useState<'colors' | 'generator' | 'palettes'>('colors');
  const [showProfile, setShowProfile] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showTwoFactorManager, setShowTwoFactorManager] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [paletteName, setPaletteName] = useState(''); // Estado para el nombre de la paleta
  // 2FA states - removed unnecessary states

  // Filter colors based on search and favorites - moved before conditional returns
  const filteredColors = useMemo(() => {
    return colors.filter(color => {
      const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           color.hex.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !filterFavorites || color.isFavorite;
      return matchesSearch && matchesFavorites;
    });
  }, [colors, searchTerm, filterFavorites]);

  const favoriteColors = colors.filter(color => color.isFavorite);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-lg">Cargando...</span>
        </div>
      </div>
    );
  }

  // Login con soporte para 2FA
  const handleLogin = async (email: string, password: string) => {
    return await login(email, password);
  };

  // Verificación de código 2FA
  const handleVerifyTwoFactor = async (user: { id: string; email: string; name: string; password: string; createdAt: string | Date; twoFactorEnabled?: boolean; twoFactorSecret?: string }, code: string) => {
    return await verifyTwoFactorLogin(user, code);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onRegister={register} 
        onPasswordReset={resetPassword}
        onVerifyTwoFactor={handleVerifyTwoFactor}
      />
    );
  }

  const addColor = () => {
    if (!newColorName.trim()) return;

    const rgb = hexToRgb(newColorValue);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const newColor: Color = {
      id: Date.now().toString(),
      name: newColorName.trim(),
      hex: newColorValue,
      rgb,
      hsl,
      isFavorite: false,
      createdAt: new Date()
    };

    setColors(prev => [newColor, ...prev]);
    setNewColorName('');
  };

  const addGeneratedColors = (generatedColors: Color[]) => {
    setColors(prev => [...generatedColors, ...prev]);
  };

  const toggleFavorite = (id: string) => {
    setColors(prev => prev.map(color => 
      color.id === id ? { ...color, isFavorite: !color.isFavorite } : color
    ));
  };

  const deleteColor = (id: string) => {
    setColors(prev => prev.filter(color => color.id !== id));
  };

  const renameColor = (id: string, newName: string) => {
    setColors(prev => prev.map(color => 
      color.id === id ? { ...color, name: newName } : color
    ));
  };

  const exportColors = () => {
    const dataStr = JSON.stringify({ colors, palettes }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'color-palette.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importColors = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.colors) setColors(data.colors);
        if (data.palettes) setPalettes(data.palettes);
      } catch (error) {
        console.error('Error importing colors:', error);
      }
    };
    reader.readAsText(file);
  };

  const clearAllColors = () => {
    if (window.confirm('Are you sure you want to delete all colors? This action cannot be undone.')) {
      setColors([]);
    }
  };

  // Show profile page if open
  if (showProfile) {
    return (
      <ProfilePage
        user={user!}
        favoriteColors={favoriteColors}
        onToggleFavorite={toggleFavorite}
        onDeleteColor={deleteColor}
        onRenameColor={renameColor}
        onUpdateProfile={updateProfile}
        onClose={() => setShowProfile(false)}
        onDeleteAccount={deleteAccount}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Palette className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    DevPalette
                  </h1>
                  <p className="text-sm text-gray-400">Professional Color Tool for Developers</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <UserMenu 
                user={user!} 
                onLogout={logout}
                onOpenProfile={() => setShowProfile(true)}
                onOpenTwoFactor={() => setShowTwoFactorManager(true)}
              />
              
              <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Vista en lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={exportColors}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  // Exportar imagen de la paleta actual (colores)
                  const exportPaletteAsImage = (paletteColors: Color[], filename = 'palette.png') => {
                    const width = 80 * paletteColors.length;
                    const height = 120;
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    // Fondo
                    ctx.fillStyle = '#22223b';
                    ctx.fillRect(0, 0, width, height);
                    // Dibujar cada color
                    paletteColors.forEach((color, i) => {
                      ctx.fillStyle = color.hex;
                      ctx.fillRect(i * 80 + 10, 10, 60, 60);
                      ctx.strokeStyle = '#fff';
                      ctx.lineWidth = 2;
                      ctx.strokeRect(i * 80 + 10, 10, 60, 60);
                      ctx.font = 'bold 14px monospace';
                      ctx.fillStyle = '#fff';
                      ctx.textAlign = 'center';
                      ctx.fillText(color.hex.toUpperCase(), i * 80 + 40, 90);
                    });
                    // Descargar imagen
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  };
                  exportPaletteAsImage(colors, 'color-palette.png');
                }}
                className="flex items-center space-x-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg transition-colors"
              >
                <span>Exportar imagen</span>
              </button>
              
              <label className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                <Download className="w-4 h-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importColors}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { key: 'colors', label: 'My Colors', count: colors.length },
              { key: 'generator', label: 'Generator', count: null },
              { key: 'palettes', label: 'Palettes', count: palettes.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'colors' | 'generator' | 'palettes')}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'colors' && (
          <div className="space-y-8">
            {/* Add New Color */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add New Color</span>
              </h2>
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color Name
                  </label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Enter color name..."
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addColor()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color Value
                  </label>
                  <ColorPicker 
                    color={newColorValue}
                    onChange={setNewColorValue}
                  />
                </div>
                <button
                  onClick={addColor}
                  disabled={!newColorName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Add Color
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search colors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500 focus:outline-none w-64"
                  />
                </div>
                
                <button
                  onClick={() => setFilterFavorites(!filterFavorites)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    filterFavorites
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${filterFavorites ? 'fill-current' : ''}`} />
                  <span>Favorites</span>
                  {favoriteColors.length > 0 && (
                    <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">
                      {favoriteColors.length}
                    </span>
                  )}
                </button>
              </div>

              {colors.length > 0 && (
                <button
                  onClick={clearAllColors}
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Colors Grid */}
            {filteredColors.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1 md:grid-cols-2'
              }`}>
                {filteredColors.map((color) => (
                  <ColorCard
                    key={color.id}
                    color={color}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteColor}
                    onRename={renameColor}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Palette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  {colors.length === 0 ? 'No colors yet' : 'No colors found'}
                </h3>
                <p className="text-gray-500">
                  {colors.length === 0 
                    ? 'Add your first color to get started'
                    : 'Try adjusting your search or filters'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generator' && (
          <ColorGenerator onAddColors={addGeneratedColors} />
        )}

        {activeTab === 'palettes' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Color Palettes</span>
              </h2>
              {/* Selección de hasta 3 colores favoritos para combinar */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Selecciona hasta 3 colores favoritos para combinar:</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {favoriteColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColors((prev) => {
                          if (prev.some((c) => c.id === color.id)) {
                            return prev.filter((c) => c.id !== color.id);
                          } else if (prev.length < 3) {
                            return [...prev, color];
                          } else {
                            return prev;
                          }
                        });
                      }}
                      className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                        selectedColors.some((c) => c.id === color.id)
                          ? 'border-purple-500 scale-110'
                          : 'border-gray-700 hover:border-purple-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name} - ${selectedColors.some((c) => c.id === color.id) ? 'Seleccionado' : 'Seleccionar'}`}
                    >
                      {selectedColors.some((c) => c.id === color.id) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Input para nombre de la paleta */}
                <input
                  type="text"
                  value={paletteName}
                  onChange={e => setPaletteName(e.target.value)}
                  placeholder="Nombre de la paleta..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none mb-2"
                  maxLength={30}
                />
              </div>
              {/* Mostrar color combinado y sus códigos */}
              {selectedColors.length > 0 && (
                <div className="my-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Color combinado:</h4>
                  {(() => {
                    // Calcular promedio RGB
                    const avg = selectedColors.reduce((acc, c) => {
                      acc.r += c.rgb.r;
                      acc.g += c.rgb.g;
                      acc.b += c.rgb.b;
                      return acc;
                    }, { r: 0, g: 0, b: 0 });
                    const n = selectedColors.length;
                    const avgR = Math.round(avg.r / n);
                    const avgG = Math.round(avg.g / n);
                    const avgB = Math.round(avg.b / n);
                    const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
                    // Calcular HSL
                    function rgbToHsl(r: number, g: number, b: number) {
                      r /= 255; g /= 255; b /= 255;
                      const max = Math.max(r, g, b), min = Math.min(r, g, b);
                      let h: number = 0;
                      let s: number;
                      const l = (max + min) / 2;
                      if (max === min) { h = s = 0; }
                      else {
                        const d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                          case g: h = (b - r) / d + 2; break;
                          case b: h = (r - g) / d + 4; break;
                        }
                        h /= 6;
                      }
                      return {
                        h: Math.round(h * 360),
                        s: Math.round(s * 100),
                        l: Math.round(l * 100)
                      };
                    }
                    const hsl = rgbToHsl(avgR, avgG, avgB);
                    return (
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-700" style={{ backgroundColor: hex }} />
                        <div className="space-y-1 text-sm">
                          <div><span className="text-gray-400">HEX:</span> <span className="font-mono">{hex.toUpperCase()}</span></div>
                          <div><span className="text-gray-400">RGB:</span> <span className="font-mono">rgb({avgR}, {avgG}, {avgB})</span></div>
                          <div><span className="text-gray-400">HSL:</span> <span className="font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <button
                onClick={() => {
                  if (selectedColors.length === 0) return;
                  const name = paletteName.trim() ? paletteName.trim() : `Palette ${palettes.length + 1}`;
                  const newPalette: ColorPalette = {
                    id: Date.now().toString(),
                    name,
                    colors: selectedColors,
                    createdAt: new Date(),
                    isFavorite: false
                  };
                  setPalettes(prev => [newPalette, ...prev]);
                  setSelectedColors([]);
                  setPaletteName(''); // Limpiar el input después de crear la paleta
                }}
                disabled={selectedColors.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors mb-4"
              >
                Crear paleta combinada
              </button>
              {palettes.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    No hay paletas creadas
                  </h3>
                  <p className="text-gray-500">
                    Marca colores como favoritos y crea tu primera paleta
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {palettes.map((palette) => (
                    <div key={palette.id} className="bg-gray-900 rounded-xl border border-gray-700 p-4 relative">
                      <button
                        onClick={() => {
                          setPalettes(prev => prev.filter((p) => p.id !== palette.id));
                        }}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        title="Borrar paleta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h3 className="font-bold text-white mb-2 text-lg">{palette.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {palette.colors.map((color) => (
                          <div key={color.id} className="w-10 h-10 rounded-lg border-2 border-gray-700" style={{ backgroundColor: color.hex }} title={color.name}></div>
                        ))}
                      </div>
                      {/* Mostrar el color combinado de la paleta */}
                      {palette.colors.length > 0 && (() => {
                        const avg = palette.colors.reduce((acc, c) => {
                          acc.r += c.rgb.r;
                          acc.g += c.rgb.g;
                          acc.b += c.rgb.b;
                          return acc;
                        }, { r: 0, g: 0, b: 0 });
                        const n = palette.colors.length;
                        const avgR = Math.round(avg.r / n);
                        const avgG = Math.round(avg.g / n);
                        const avgB = Math.round(avg.b / n);
                        const hex = `#${((1 << 24) + (avgR << 16) + (avgG << 8) + avgB).toString(16).slice(1)}`;
                        return (
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="w-10 h-10 rounded-lg border-2 border-purple-500" style={{ backgroundColor: hex }} title="Color combinado"></div>
                            <div className="space-y-1 text-xs">
                              <div><span className="text-gray-400">Combinado:</span> <span className="font-mono">{hex.toUpperCase()}</span></div>
                              <div><span className="text-gray-400">RGB:</span> <span className="font-mono">rgb({avgR}, {avgG}, {avgB})</span></div>
                            </div>
                          </div>
                        );
                      })()}
                      <p className="text-xs text-gray-400 mt-2">{palette.colors.length} colores</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 2FA Modals */}
      {showTwoFactorManager && (
        <TwoFactorManager
          user={user!}
          onSetupTwoFactor={() => {
            setShowTwoFactorManager(false);
            setShowTwoFactorSetup(true);
          }}
          onDisableTwoFactor={disableTwoFactor}
          onClose={() => setShowTwoFactorManager(false)}
        />
      )}

      {showTwoFactorSetup && (
        <TwoFactorSetup
          user={user!}
          onSetupComplete={setupTwoFactor}
          onClose={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
}

export default App;