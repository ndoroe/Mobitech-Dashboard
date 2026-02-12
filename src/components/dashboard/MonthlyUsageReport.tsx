import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import axios from 'axios';

interface MonthlyUsageData {
  month: string;
  totalDataUsedGB: number;
  totalDataSizeGB: number;
  avgUsagePercent: string;
  simCount: number;
  recordCount: number;
}

const MonthlyUsageReport: React.FC = () => {
  const [data, setData] = useState<MonthlyUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<number>(12);

  const fetchData = async (monthsBack: number) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reports/monthly-usage?months=${monthsBack}`
      );
      if (response.data.success) {
        setData(response.data.data.monthlyUsage);
        setError(null);
      } else {
        setError('Failed to fetch monthly usage data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(months);
  }, [months]);

  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setMonths(event.target.value as number);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Paper>
    );
  }

  // Prepare data for chart
  const monthLabels = data.map(d => d.month);
  const usageData = data.map(d => d.totalDataUsedGB);

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 2,
        gap: 1
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Total Data Usage - Monthly Report
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={months} label="Period" onChange={handleMonthChange}>
            <MenuItem value={3}>3 Months</MenuItem>
            <MenuItem value={6}>6 Months</MenuItem>
            <MenuItem value={12}>12 Months</MenuItem>
            <MenuItem value={24}>24 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ width: '100%', height: { xs: 300, sm: 350 }, overflowX: 'auto' }}>
        <BarChart
          xAxis={[
            {
              data: monthLabels,
              scaleType: 'band',
              label: 'Month',
            },
          ]}
          series={[
            {
              data: usageData,
              label: 'Total Usage (GB)',
              color: '#1976d2',
            },
          ]}
          height={300}
          margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
          yAxis={[
            {
              label: 'Data Usage (GB)',
            },
          ]}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total across all SIM cards for the selected period
        </Typography>
      </Box>
    </Paper>
  );
};

export default MonthlyUsageReport;
