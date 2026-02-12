import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
  Link as MuiLink,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://192.168.101.15:5000/api';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setTokenExpired(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, {
        password,
        confirmPassword
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth/login', { state: { message: 'Password reset successful. Please log in with your new password.' } });
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password.');
        if (response.data.expired) {
          setTokenExpired(true);
        }
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errorMessage = err.response?.data?.message || 'An error occurred while resetting password.';
      setError(errorMessage);
      
      if (err.response?.data?.expired) {
        setTokenExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your new password below.
            </Typography>

            {success && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                Password has been reset successfully! Redirecting to login...
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
                {tokenExpired && (
                  <Box sx={{ mt: 1 }}>
                    <MuiLink component={Link} to="/auth/forgot-password">
                      Request a new password reset
                    </MuiLink>
                  </Box>
                )}
              </Alert>
            )}

            {!token ? (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <MuiLink component={Link} to="/auth/forgot-password" variant="body2">
                  Request Password Reset
                </MuiLink>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Password must be at least 8 characters long.
                </Typography>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading || success || !token}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <MuiLink component={Link} to="/auth/login" variant="body2">
                    Back to Login
                  </MuiLink>
                </Box>
              </Box>
            )}
          </Box>
    </>
  );
}
