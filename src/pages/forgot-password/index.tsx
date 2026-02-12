import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://192.168.101.15:5000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email
      });

      if (response.data.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(response.data.message || 'Failed to send reset email.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(
        err.response?.data?.message ||
        'An error occurred while sending the reset email.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h5" gutterBottom>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {success && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                If an account with this email exists, a password reset link has been sent.
                Please check your email (and spam folder).
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
                type="email"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || success}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink component={Link} to="/auth/login" variant="body2">
                  Back to Login
                </MuiLink>
              </Box>

              {success && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setSuccess(false)}
                    fullWidth
                  >
                    Send Another Email
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
    </>
  );
}
