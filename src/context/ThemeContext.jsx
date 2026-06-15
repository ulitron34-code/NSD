import React, { createContext, useContext, useState, useEffect } from 'react';

export const COLORS_LIGHT = {
  // Brand colors
  navy: '#0F1F2E',
  gold: '#C9A227',
  blue: '#1565C0',
  green: '#2E7D32',
  red: '#C62828',
  amber: '#F57C00',
  
  // Neutrals
  white: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  
  // Text
  text: '#1E293B',
  textMuted: '#64748B',
  
  // Shadows
  shadowSm: '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.1)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.12)',
};

export const COLORS_DARK = {
  // Brand colors (same)
  navy: '#0F1F2E', // Keep navy dark
  gold: '#D4AF37', // Slightly brighter gold
  blue: '#42A5F5',
  green: '#66BB6A',
  red: '#EF5350',
  amber: '#FFA726',
  
  // Neutrals (dark mode)
  white: '#1E293B', // Card backgrounds
  bg: '#0F172A', // Main background
  border: '#334155', // Borders
  
  // Text (light text on dark bg)
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  
  // Shadows (softer in dark)
  shadowSm: '0 1px 3px rgba(0,0,0,0.3)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.4)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.5)',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('nsd_theme');
    if (saved) return saved === 'dark';
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('nsd_theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  
  const colors = isDarkMode ? COLORS_DARK : COLORS_LIGHT;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeContext;