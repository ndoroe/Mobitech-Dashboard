import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Divider,
  InputAdornment,
} from '@mui/material';
import { IconDeviceFloppy, IconRestore } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  preferencesService,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from '../../services/preferences';

const Settings: FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form validation errors
  const [errors, setErrors] = useState<{
    warning_threshold?: string;
    critical_threshold?: string;
    projected_threshold?: string;
  }>({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await preferencesService.getPreferences();
      // Convert numeric boolean from database to actual boolean
      setPreferences({
        ...data,
        alerts_enabled: Boolean(data.alerts_enabled),
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load preferences. Using defaults.',
        severity: 'error',
      });
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (
      preferences.warning_threshold < 0 ||
      preferences.warning_threshold > 100
    ) {
      newErrors.warning_threshold = 'Must be between 0 and 100';
    }

    if (
      preferences.critical_threshold < 0 ||
      preferences.critical_threshold > 100
    ) {
      newErrors.critical_threshold = 'Must be between 0 and 100';
    }

    if (
      preferences.projected_threshold < 0 ||
      preferences.projected_threshold > 100
    ) {
      newErrors.projected_threshold = 'Must be between 0 and 100';
    }

    if (preferences.warning_threshold >= preferences.critical_threshold) {
      newErrors.warning_threshold = 'Must be less than critical threshold';
      newErrors.critical_threshold = 'Must be greater than warning threshold';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix validation errors',
        severity: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      const updated = await preferencesService.updatePreferences({
        alerts_enabled: preferences.alerts_enabled,
        warning_threshold: preferences.warning_threshold,
        critical_threshold: preferences.critical_threshold,
        projected_threshold: preferences.projected_threshold,
        email_alerts_enabled: preferences.email_alerts_enabled,
        email_alert_time: preferences.email_alert_time,
        warning_color: preferences.warning_color,
        critical_color: preferences.critical_color,
      });
      setPreferences(updated);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully!',
        severity: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      const reset = await preferencesService.resetPreferences();
      setPreferences(reset);
      setErrors({});
      setSnackbar({
        open: true,
        message: 'Settings reset to defaults',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reset settings',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Settings">
        <Typography>Loading settings...</Typography>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid item xs={12} md={8} lg={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Alert Notification Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Configure when and how you want to receive SIM usage alerts
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={3}>
                {/* Enable Alerts */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.alerts_enabled}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          alerts_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Enable Alert Notifications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show modal and notification icon alerts when SIM usage
                        exceeds thresholds
                      </Typography>
                    </Box>
                  }
                />

                <Divider />

                {/* Threshold Configuration */}
                <Typography variant="subtitle2" fontWeight="bold">
                  Usage Thresholds
                </Typography>

                <TextField
                  fullWidth
                  label="Warning Threshold"
                  type="number"
                  value={preferences.warning_threshold}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      warning_threshold: parseFloat(e.target.value) || 0,
                    });
                    setErrors({ ...errors, warning_threshold: undefined });
                  }}
                  error={!!errors.warning_threshold}
                  helperText={
                    errors.warning_threshold ||
                    'Alert when usage is between this and critical threshold'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 5,
                  }}
                  disabled={!preferences.alerts_enabled}
                />

                <TextField
                  fullWidth
                  label="Critical Threshold"
                  type="number"
                  value={preferences.critical_threshold}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      critical_threshold: parseFloat(e.target.value) || 0,
                    });
                    setErrors({ ...errors, critical_threshold: undefined });
                  }}
                  error={!!errors.critical_threshold}
                  helperText={
                    errors.critical_threshold ||
                    'Alert when usage equals or exceeds this percentage'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 5,
                  }}
                  disabled={!preferences.alerts_enabled}
                />

                <TextField
                  fullWidth
                  label="Projected Usage Threshold"
                  type="number"
                  value={preferences.projected_threshold}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      projected_threshold: parseFloat(e.target.value) || 0,
                    });
                    setErrors({ ...errors, projected_threshold: undefined });
                  }}
                  error={!!errors.projected_threshold}
                  helperText={
                    errors.projected_threshold ||
                    'Alert when projected end-of-month usage equals or exceeds this percentage'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 5,
                  }}
                  disabled={!preferences.alerts_enabled}
                />

                <Divider />

                {/* Color Configuration */}
                <Typography variant="subtitle2" fontWeight="bold">
                  Alert Colors
                </Typography>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Warning Color ({preferences.warning_threshold}% -{' '}
                    {preferences.critical_threshold - 0.01}%)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="color"
                      value={preferences.warning_color}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          warning_color: e.target.value,
                        })
                      }
                      disabled={!preferences.alerts_enabled}
                      style={{
                        width: 60,
                        height: 40,
                        cursor: preferences.alerts_enabled
                          ? 'pointer'
                          : 'not-allowed',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />
                    <TextField
                      size="small"
                      value={preferences.warning_color}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          warning_color: e.target.value,
                        })
                      }
                      disabled={!preferences.alerts_enabled}
                      placeholder="#ed6c02"
                      sx={{ width: 120 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      (Orange)
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Critical Color ({preferences.critical_threshold}%+)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="color"
                      value={preferences.critical_color}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          critical_color: e.target.value,
                        })
                      }
                      disabled={!preferences.alerts_enabled}
                      style={{
                        width: 60,
                        height: 40,
                        cursor: preferences.alerts_enabled
                          ? 'pointer'
                          : 'not-allowed',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    />
                    <TextField
                      size="small"
                      value={preferences.critical_color}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          critical_color: e.target.value,
                        })
                      }
                      disabled={!preferences.alerts_enabled}
                      placeholder="#d32f2f"
                      sx={{ width: 120 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      (Red)
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                {/* Email Alert Reports */}
                <Typography variant="subtitle2" fontWeight="bold">
                  Email Alert Reports
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email_alerts_enabled}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          email_alerts_enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Receive Emailed Alert Reports
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Get a daily email report of SIM usage alerts
                      </Typography>
                    </Box>
                  }
                />

                <TextField
                  fullWidth
                  label="Report Delivery Time"
                  type="time"
                  value={preferences.email_alert_time}
                  onChange={(e) => {
                    setPreferences({
                      ...preferences,
                      email_alert_time: e.target.value,
                    });
                  }}
                  helperText="Time of day to receive daily alert reports"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  disabled={!preferences.email_alerts_enabled}
                />

                <Divider />

                {/* Action Buttons */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="flex-end"
                >
                  <Button
                    variant="outlined"
                    startIcon={<IconRestore />}
                    onClick={handleReset}
                    disabled={saving}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<IconDeviceFloppy />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About Alert Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Alerts are shown once per day when you login to the dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • The notification icon (bell) displays real-time alert counts
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Click on alerts to view detailed SIM usage reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Warning threshold should be lower than critical threshold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default Settings;
