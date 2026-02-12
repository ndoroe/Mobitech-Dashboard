import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { IconEye, IconX } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { TopConsumer } from '../../services/simcard';
import { SimUsageGraph } from './SimUsageGraph';

interface Props {
  consumers: TopConsumer[];
  loading?: boolean;
}

export const TopConsumersTable: FC<Props> = ({ consumers, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedSim, setSelectedSim] = useState<string | null>(null);

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'error';
    if (percent >= 80) return 'warning';
    if (percent >= 60) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle undefined or null consumers
  const safeConsumers = consumers || [];

  return (
    <>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Top Data Consumers
      </Typography>
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <Table size="small" sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>ICCID</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>MSISDN</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Used (MB)</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Capacity (MB)</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Usage %</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Last Connection</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {safeConsumers.map((consumer) => {
              const usagePercent = parseFloat(consumer.usagePercent);
              return (
                <TableRow key={consumer.iccid} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      {consumer.iccid}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {consumer.msisdn}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {consumer.totalUsed}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {consumer.dataSize}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${usagePercent.toFixed(1)}%`}
                      size="small"
                      color={getUsageColor(usagePercent)}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.8125rem' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="caption" color="text.secondary">
                      {consumer.lastConnection
                        ? new Date(consumer.lastConnection).toLocaleString()
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setSelectedSim(consumer.iccid)}
                      aria-label="view usage history"
                    >
                      <IconEye size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      {safeConsumers.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      )}

      {/* SIM Usage Dialog */}
      <Dialog
        open={!!selectedSim}
        onClose={() => setSelectedSim(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                SIM Usage History
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {selectedSim}
              </Typography>
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setSelectedSim(null)}
              aria-label="close"
              sx={{ ml: 1 }}
            >
              <IconX size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSim && <SimUsageGraph iccid={selectedSim} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSelectedSim(null)}
            variant="outlined"
            fullWidth={isMobile}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
