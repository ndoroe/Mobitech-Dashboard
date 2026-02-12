import { Card, CardContent, Typography, Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import { FC } from 'react';

interface Props {
  totalCapacity: number;
  totalUsed: number;
  percentage: number;
  loading?: boolean;
}

export const PoolUtilization: FC<Props> = ({ totalCapacity, totalUsed, percentage, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Pool Utilization
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={percentage}
              size={isMobile ? 100 : 120}
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
              <Typography variant="h4" component="div" color="text.secondary" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {`${Math.round(percentage)}%`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 2, sm: 3 }, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total Capacity:
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {totalCapacity.toFixed(2)} GB
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total Used:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={getColor()} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {totalUsed.toFixed(2)} GB
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Available:
              </Typography>
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {(totalCapacity - totalUsed).toFixed(2)} GB
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
