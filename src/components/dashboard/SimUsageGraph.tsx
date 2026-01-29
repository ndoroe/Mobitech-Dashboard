import { Box, CircularProgress, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { FC, useEffect, useState } from 'react';
import { simService, SimHistory } from '../../services/simcard';

interface Props {
  iccid: string;
}

export const SimUsageGraph: FC<Props> = ({ iccid }) => {
  const [history, setHistory] = useState<SimHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'mtd'>('week');
  const [groupBy, setGroupBy] = useState<'hour' | 'day'>('day');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await simService.getHistory(iccid, period, groupBy);
        setHistory(data.history);
      } catch (error) {
        console.error('Error fetching SIM history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [iccid, period, groupBy]);

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: 'day' | 'week' | 'month' | 'mtd' | null) => {
    if (newPeriod) {
      setPeriod(newPeriod);
      // Use hourly grouping for Last 24 Hours to show all markers, daily for others
      if (newPeriod === 'day') {
        setGroupBy('hour');
      } else {
        setGroupBy('day');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No usage data available</Typography>
      </Box>
    );
  }

  const chartData = history.map(h => ({
    time: h.time,
    used: parseFloat(h.dataUsed),
    capacity: parseFloat(h.dataSize)
  }));

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
        >
          <ToggleButton value="day">Last 24 Hours</ToggleButton>
          <ToggleButton value="week">Last Week</ToggleButton>
          <ToggleButton value="mtd">Month to Date</ToggleButton>
          <ToggleButton value="month">Last Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <LineChart
        dataset={chartData}
        xAxis={[{
          scaleType: 'point',
          dataKey: 'time',
          tickLabelStyle: {
            fontSize: 10,
            angle: -45,
            textAnchor: 'end',
          }
        }]}
        yAxis={[{
          label: 'Data (MB)',
          labelStyle: {
            fontSize: 14,
          }
        }]}
        series={[
          {
            dataKey: 'used',
            label: 'Data Used',
            color: '#2196f3',
            showMark: true,
          }
        ]}
        height={420}
        margin={{ top: 20, right: 30, bottom: 140, left: 80 }}
      />
    </Box>
  );
};
