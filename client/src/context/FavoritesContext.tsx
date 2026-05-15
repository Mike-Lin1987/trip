import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (guideId: string) => void;
  isFavorite: (guideId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/favorites`)
      .then(res => res.json())
      .then(data => {
        setFavorites(data.map((g: any) => g.id));
      })
      .catch(err => console.error('Error fetching favorites:', err));
  }, []);

  const toggleFavorite = async (guideId: string) => {
    const isFav = favorites.includes(guideId);
    const method = isFav ? 'DELETE' : 'POST';
    
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/${guideId}`, { method });
      if (res.ok) {
        if (isFav) {
          setFavorites(favorites.filter(id => id !== guideId));
        } else {
          setFavorites([...favorites, guideId]);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const isFavorite = (guideId: string) => favorites.includes(guideId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
