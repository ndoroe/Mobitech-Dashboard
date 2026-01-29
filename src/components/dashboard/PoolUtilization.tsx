import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { FC } from 'react';

interface Props {
  totalCapacity: number;
  totalUsed: number;
  percentage: number;
  loading?: boolean;
}

export const PoolUtilization: FC<Props> = ({ totalCapacity, totalUsed, percentage, loading }) => {
  const getColor = () => {
    if (percentage >= 90) return 'error';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          Pool Utilization
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={120}
              thickness={5}
              color={getColor()}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h4" component="div" color="text.secondary">
                {`${Math.round(percentage)}%`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Capacity:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {totalCapacity.toFixed(2)} GB
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Used:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={getColor()}>
                {totalUsed.toFixed(2)} GB
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Available:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {(totalCapacity - totalUsed).toFixed(2)} GB
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
