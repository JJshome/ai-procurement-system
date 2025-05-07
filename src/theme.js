import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3B82F6', // Blue
      light: '#93C5FD',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Green
      light: '#A7F3D0',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444', // Red
      light: '#FCA5A5',
      dark: '#B91C1C',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B', // Amber
      light: '#FCD34D',
      dark: '#B45309',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0EA5E9', // Light Blue
      light: '#BAE6FD',
      dark: '#0369A1',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Emerald
      light: '#A7F3D0',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Slate 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B', // Slate 800
      secondary: '#64748B', // Slate 500
      disabled: '#94A3B8', // Slate 400
    },
  },
  typography: {
    fontFamily: "'Pretendard', 'Noto Sans KR', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.75,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.66,
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 2px 4px rgba(0, 0, 0, 0.06), 0px 4px 6px rgba(0, 0, 0, 0.1)',
    '0px 4px 8px rgba(0, 0, 0, 0.06), 0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.06), 0px 16px 24px rgba(0, 0, 0, 0.1)',
    '0px 16px 24px rgba(0, 0, 0, 0.06), 0px 20px 28px rgba(0, 0, 0, 0.1)',
    ...Array(19).fill(''),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(to bottom, #3B82F6, #2563EB)',
          '&:hover': {
            backgroundImage: 'linear-gradient(to bottom, #2563EB, #1D4ED8)',
            boxShadow: '0px 4px 8px rgba(37, 99, 235, 0.25)',
          },
        },
        containedSecondary: {
          backgroundImage: 'linear-gradient(to bottom, #10B981, #059669)',
          '&:hover': {
            backgroundImage: 'linear-gradient(to bottom, #059669, #047857)',
            boxShadow: '0px 4px 8px rgba(5, 150, 105, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;