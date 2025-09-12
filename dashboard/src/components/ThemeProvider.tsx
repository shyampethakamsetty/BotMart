import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark' | 'system';
type HighContrastMode = boolean;

interface ThemeContextType {
  mode: ThemeMode;
  highContrast: HighContrastMode;
  setMode: (mode: ThemeMode) => void;
  setHighContrast: (enabled: HighContrastMode) => void;
  toggleMode: () => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Initialize from localStorage if available, otherwise use defaults
  const [mode, setMode] = useState<ThemeMode>('light');
  const [highContrast, setHighContrast] = useState<HighContrastMode>(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
    
    if (savedHighContrast) {
      setHighContrast(savedHighContrast);
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    localStorage.setItem('highContrast', String(highContrast));
  }, [mode, highContrast]);

  // Toggle functions
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  // Create theme based on current settings
  const theme = createTheme({
    palette: {
      mode: mode === 'system' 
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode,
      ...(highContrast && {
        // High contrast overrides
        primary: {
          main: mode === 'dark' ? '#00E5FF' : '#0066CC',
          contrastText: mode === 'dark' ? '#000000' : '#FFFFFF',
        },
        secondary: {
          main: mode === 'dark' ? '#FFD700' : '#9900CC',
          contrastText: mode === 'dark' ? '#000000' : '#FFFFFF',
        },
        background: {
          default: mode === 'dark' ? '#000000' : '#FFFFFF',
          paper: mode === 'dark' ? '#121212' : '#F5F5F5',
        },
        text: {
          primary: mode === 'dark' ? '#FFFFFF' : '#000000',
          secondary: mode === 'dark' ? '#CCCCCC' : '#333333',
        },
        error: {
          main: '#FF0000',
        },
        warning: {
          main: '#FFA500',
        },
        info: {
          main: '#00BFFF',
        },
        success: {
          main: '#00CC00',
        },
      }),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            textTransform: 'none',
            fontWeight: 600,
            ...(highContrast && {
              border: '2px solid',
              borderColor: 'currentColor',
            }),
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            ...(highContrast && {
              textDecoration: 'underline',
              fontWeight: 600,
            }),
          },
        },
      },
      MuiFocusVisible: {
        styleOverrides: {
          root: {
            outline: '2px solid',
            outlineColor: mode === 'dark' ? '#00E5FF' : '#0066CC',
            outlineOffset: 2,
          },
        },
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      ...(highContrast && {
        allVariants: {
          lineHeight: 1.5,
          letterSpacing: 0.5,
        },
      }),
    },
  });

  return (
    <ThemeContext.Provider
      value={{
        mode,
        highContrast,
        setMode,
        setHighContrast,
        toggleMode,
        toggleHighContrast,
      }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};