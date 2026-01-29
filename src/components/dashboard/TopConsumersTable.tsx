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
} from '@mui/material';
import { FC } from 'react';
import { TopConsumer } from '../../services/simcard';

interface Props {
  consumers: TopConsumer[];
  loading?: boolean;
}

export const TopConsumersTable: FC<Props> = ({ consumers, loading }) => {
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

  return (
    <>
      <Typography component="h2" variant="h6" color="primary" gutterBottom>
        Top Data Consumers
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ICCID</TableCell>
            <TableCell>MSISDN</TableCell>
            <TableCell align="right">Used (MB)</TableCell>
            <TableCell align="right">Capacity (MB)</TableCell>
            <TableCell align="right">Usage %</TableCell>
            <TableCell>Last Connection</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {consumers.map((consumer) => {
            const usagePercent = parseFloat(consumer.usagePercent);
            return (
              <TableRow key={consumer.iccid} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {consumer.iccid}
                  </Typography>
                </TableCell>
                <TableCell>{consumer.msisdn}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {consumer.totalUsed}
                  </Typography>
                </TableCell>
                <TableCell align="right">{consumer.dataSize}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${usagePercent.toFixed(1)}%`}
                    size="small"
                    color={getUsageColor(usagePercent)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {consumer.lastConnection
                      ? new Date(consumer.lastConnection).toLocaleString()
                      : 'N/A'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {consumers.length === 0 && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      )}
    </>
  );
};
