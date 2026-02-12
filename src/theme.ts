import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
const theme = createTheme({
  palette: {
    error: {
      main: red.A400,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  typography: {
    // Responsive font sizes
    h1: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          // Better touch targets on mobile
          minHeight: 36,
          '@media (max-width:600px)': {
            minHeight: 44,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          // Better touch targets on mobile
          '@media (max-width:600px)': {
            padding: 12,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          // Reduce padding on mobile
          '@media (max-width:600px)': {
            padding: '8px 4px',
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          // Reduce padding on mobile
          '@media (max-width:600px)': {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
  },
});

export default theme;
