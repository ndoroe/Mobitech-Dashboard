import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  Stack,
  Typography,
  ListItemButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { IconAlertTriangle, IconExternalLink } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AlertSim {
  iccid: string;
  msisdn: string;
  dataUsed: string;
  dataSize: string;
  usagePercent: string;
  lastConnection: string | null;
}

interface UsageAlertModalProps {
  open: boolean;
  onClose: () => void;
  alerts: AlertSim[];
  warningThreshold: number;
  criticalThreshold: number;
  warningColor: string;
  criticalColor: string;
}

export const UsageAlertModal: FC<UsageAlertModalProps> = ({
  open,
  onClose,
  alerts,
  warningThreshold,
  criticalThreshold,
  warningColor,
  criticalColor,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedIccid, setSelectedIccid] = useState<string | null>(null);

  const getAlertColor = (usagePercent: string): string => {
    const usage = parseFloat(usagePercent);
    if (usage >= criticalThreshold) return criticalColor;
    if (usage >= warningThreshold) return warningColor;
    return '#2e7d32'; // Green (shouldn't happen in this modal)
  };

  const getAlertLevel = (usagePercent: string): string => {
    const usage = parseFloat(usagePercent);
    if (usage >= criticalThreshold) return 'CRITICAL';
    if (usage >= warningThreshold) return 'WARNING';
    return 'NORMAL';
  };

  const handleViewDetails = () => {
    if (selectedIccid) {
      onClose();
      navigate(`/simcards?iccid=${selectedIccid}`);
    }
  };

  const handleSelectSim = (iccid: string) => {
    setSelectedIccid(iccid);
  };

  const criticalAlerts = alerts.filter(
    (alert) => parseFloat(alert.usagePercent) >= criticalThreshold
  );
  const warningAlerts = alerts.filter(
    (alert) =>
      parseFloat(alert.usagePercent) >= warningThreshold &&
      parseFloat(alert.usagePercent) < criticalThreshold
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderTop: `4px solid ${criticalAlerts.length > 0 ? criticalColor : warningColor}`,
        },
      }}
    >
      <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <IconAlertTriangle
            size={isMobile ? 24 : 28}
            color={criticalAlerts.length > 0 ? criticalColor : warningColor}
          />
          <Box>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>SIM Usage Alerts</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {alerts.length} SIM card{alerts.length !== 1 ? 's' : ''} exceeded
              usage threshold
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: { xs: '60vh', sm: 400 }, p: 0 }}>
        {criticalAlerts.length > 0 && (
          <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Critical Alerts ({criticalAlerts.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Usage ≥ {criticalThreshold}%
            </Typography>
          </Box>
        )}

        <List sx={{ pt: 0 }}>
          {criticalAlerts.map((alert, index) => (
            <Box key={alert.iccid}>
              <ListItemButton
                onClick={() => handleSelectSim(alert.iccid)}
                selected={selectedIccid === alert.iccid}
                sx={{
                  py: 2,
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body1" fontWeight="medium">
                      {alert.iccid}
                    </Typography>
                    <Chip
                      label={`${alert.usagePercent}%`}
                      size="small"
                      sx={{
                        bgcolor: getAlertColor(alert.usagePercent),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    <Chip
                      label={getAlertLevel(alert.usagePercent)}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: getAlertColor(alert.usagePercent),
                        color: getAlertColor(alert.usagePercent),
                      }}
                    />
                  </Stack>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      MSISDN: {alert.msisdn || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usage: {alert.dataUsed} MB / {alert.dataSize} MB
                    </Typography>
                    {alert.lastConnection && (
                      <Typography variant="caption" color="text.secondary">
                        Last Connection:{' '}
                        {new Date(alert.lastConnection).toLocaleString()}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </ListItemButton>
              {index < criticalAlerts.length - 1 && <Divider />}
            </Box>
          ))}
        </List>

        {warningAlerts.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Warning Alerts ({warningAlerts.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Usage {warningThreshold}% - {criticalThreshold - 0.01}%
              </Typography>
            </Box>
            <List sx={{ pt: 0 }}>
              {warningAlerts.map((alert, index) => (
                <Box key={alert.iccid}>
                  <ListItemButton
                    onClick={() => handleSelectSim(alert.iccid)}
                    selected={selectedIccid === alert.iccid}
                    sx={{
                      py: 2,
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body1" fontWeight="medium">
                          {alert.iccid}
                        </Typography>
                        <Chip
                          label={`${alert.usagePercent}%`}
                          size="small"
                          sx={{
                            bgcolor: getAlertColor(alert.usagePercent),
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        />
                        <Chip
                          label={getAlertLevel(alert.usagePercent)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getAlertColor(alert.usagePercent),
                            color: getAlertColor(alert.usagePercent),
                          }}
                        />
                      </Stack>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          MSISDN: {alert.msisdn || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Usage: {alert.dataUsed} MB / {alert.dataSize} MB
                        </Typography>
                        {alert.lastConnection && (
                          <Typography variant="caption" color="text.secondary">
                            Last Connection:{' '}
                            {new Date(alert.lastConnection).toLocaleString()}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </ListItemButton>
                  {index < warningAlerts.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Dismiss
        </Button>
        <Button
          onClick={handleViewDetails}
          variant="contained"
          disabled={!selectedIccid}
          endIcon={<IconExternalLink size={18} />}
        >
          View SIM History
        </Button>
      </DialogActions>
    </Dialog>
  );
};
