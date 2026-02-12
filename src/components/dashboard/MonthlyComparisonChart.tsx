import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';

interface MonthlyData {
  date: string;
  day: number;
  usage: number;
}

interface ComparisonData {
  lastMonth: {
    name: string;
    data: MonthlyData[];
  };
  currentMonth: {
    name: string;
    data: MonthlyData[];
  };
  unit: string;
}

const MonthlyComparisonChart: React.FC = () => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/dashboard/monthly-comparison`);
      if (response.data.success) {
        setData(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch monthly comparison data');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 2 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Paper>
    );
  }

  // Prepare data for chart
  const lastMonthDays = data.lastMonth.data.map(d => d.day);
  const lastMonthUsage = data.lastMonth.data.map(d => d.usage);
  const currentMonthDays = data.currentMonth.data.map(d => d.day);
  const currentMonthUsage = data.currentMonth.data.map(d => d.usage);

  // Create unified x-axis (days 1-31)
  const maxDays = Math.max(
    lastMonthDays.length > 0 ? Math.max(...lastMonthDays) : 0,
    currentMonthDays.length > 0 ? Math.max(...currentMonthDays) : 0,
    28
  );
  const xAxisData = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Map data to unified x-axis
  const lastMonthSeries = xAxisData.map(day => {
    const dataPoint = data.lastMonth.data.find(d => d.day === day);
    return dataPoint ? dataPoint.usage : null;
  });

  const currentMonthSeries = xAxisData.map(day => {
    const dataPoint = data.currentMonth.data.find(d => d.day === day);
    return dataPoint ? dataPoint.usage : null;
  });

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        Monthly Data Usage Comparison
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        {data.lastMonth.name} vs {data.currentMonth.name}
      </Typography>
      <Box sx={{ width: '100%', height: { xs: 300, sm: 350 }, mt: 2, overflowX: 'auto' }}>
        <LineChart
          xAxis={[
            {
              data: xAxisData,
              label: 'Day of Month',
              scaleType: 'linear',
            },
          ]}
          series={[
            {
              data: lastMonthSeries,
              label: data.lastMonth.name,
              color: '#1976d2',
              showMark: false,
              connectNulls: true,
            },
            {
              data: currentMonthSeries,
              label: data.currentMonth.name,
              color: '#2e7d32',
              showMark: false,
              connectNulls: true,
            },
          ]}
          height={300}
          margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
          yAxis={[
            {
              label: `Data Usage (${data.unit})`,
            },
          ]}
          sx={{
            '& .MuiLineElement-root': {
              strokeWidth: 2,
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default MonthlyComparisonChart;
