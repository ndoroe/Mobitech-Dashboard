import { Grid, Paper, Button, Box } from "@mui/material";
import { amber, blue, green, red } from "@mui/material/colors";
import {
  IconAlertTriangle,
  IconDatabase,
  IconRefresh,
  IconDeviceSim,
} from "@tabler/icons-react";
import { FC, useEffect, useState } from "react";
import { PageLayout, SmallBox } from "../../components";
import { PoolUtilization } from "../../components/dashboard/PoolUtilization";
import { TopConsumersTable } from "../../components/dashboard/TopConsumersTable";
import MonthlyComparisonChart from "../../components/dashboard/MonthlyComparisonChart";
import { dashboardService, DashboardStats, TopConsumer } from "../../services/simcard";

const HomePage: FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topConsumers, setTopConsumers] = useState<TopConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Fetching dashboard data...');
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      const [statsData, consumersData] = await Promise.all([
        dashboardService.getStats(0.8),
        dashboardService.getTopConsumers(10, 'month'),
      ]);
      
      console.log('✅ Stats received:', statsData);
      console.log('✅ Consumers received:', consumersData);
      
      setStats(statsData);
      setTopConsumers(consumersData);
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      alert('Failed to fetch data: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    fetchData();
  };

  return (
    <PageLayout 
      title="SIM Card Dashboard"
      actions={
        <Box>
          <Button
            variant="outlined"
            startIcon={<IconRefresh />}
            onClick={handleManualRefresh}
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "contained" : "outlined"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </Box>
      }
    >
      <Grid container spacing={3} mt={0}>
        {/* KPI Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <SmallBox
            elevation={3}
            title="Total SIM Cards"
            value={stats?.totalSims || 0}
            icon={<IconDeviceSim size={70} />}
            color={blue[500]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SmallBox
            elevation={3}
            title="Monthly Usage"
            value={`${stats?.monthlyUsage || 0} GB`}
            icon={<IconDatabase size={70} />}
            color={green[800]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SmallBox
            elevation={3}
            title="Pool Utilization"
            value={`${stats?.poolUtilization.percentage || 0}%`}
            icon={<IconDatabase size={70} />}
            color={amber[600]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SmallBox
            elevation={3}
            title="Active Alerts"
            value={stats?.alerts || 0}
            icon={<IconAlertTriangle size={70} />}
            color={red[700]}
          />
        </Grid>

        {/* Pool Utilization Widget */}
        <Grid item xs={12} md={4}>
          <PoolUtilization
            totalCapacity={parseFloat(stats?.poolUtilization.totalCapacity || '0')}
            totalUsed={parseFloat(stats?.poolUtilization.totalUsed || '0')}
            percentage={stats?.poolUtilization.percentage || 0}
            loading={loading}
          />
        </Grid>

        {/* Top Consumers Table */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <TopConsumersTable consumers={topConsumers} loading={loading} />
          </Paper>
        </Grid>

        {/* Monthly Comparison Chart */}
        <Grid item xs={12}>
          <MonthlyComparisonChart />
        </Grid>
      </Grid>
    </PageLayout>
  );
};

export default HomePage;
