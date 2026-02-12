import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { IconWifiOff } from '@tabler/icons-react';

export const OfflineFallback: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
        <IconWifiOff size={64} style={{ marginBottom: 16, color: '#999' }} />
        <Typography variant="h5" gutterBottom>
          You're Offline
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please check your internet connection and try again.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Some cached content may still be available.
        </Typography>
      </Paper>
    </Box>
  );
};
