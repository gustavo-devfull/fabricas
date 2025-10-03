import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
      light: '#66b3ff',
      dark: '#0056b3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6c757d',
      light: '#9ca3af',
      dark: '#495057',
      contrastText: '#ffffff',
    },
    success: {
      main: '#28a745',
      light: '#6cbb6a',
      dark: '#1e7e34',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ffc107',
      light: '#ffd43b',
      dark: '#e0a800',
      contrastText: '#000000',
    },
    error: {
      main: '#dc3545',
      light: '#f56565',
      dark: '#c82333',
      contrastText: '#ffffff',
    },
    info: {
      main: '#17a2b8',
      light: '#4dd0e1',
      dark: '#138496',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"DM Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
