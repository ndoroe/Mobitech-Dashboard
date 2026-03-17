import { Alert, Grid, Paper, Button, Box, Snackbar } from "@mui/material";
import { amber, blue, green, red } from "@mui/material/colors";
import {
  IconAlertTriangle,
  IconDatabase,
  IconRefresh,
  IconDeviceSim,
  IconTrendingUp,
} from "@tabler/icons-react";
import { FC, useEffect, useState } from "react";
import { PageLayout, SmallBox } from "../../components";
import { PoolUtilization } from "../../components/dashboard/PoolUtilization";
import { TopConsumersTable } from "../../components/dashboard/TopConsumersTable";
import MonthlyUsageReport from "../../components/dashboard/MonthlyUsageReport";
import MonthlyComparisonChart from "../../components/dashboard/MonthlyComparisonChart";
import {
  dashboardService,
  DashboardStats,
  TopConsumer,
  reportService,
} from "../../services/simcard";
import {
  UsageAlertModal,
  AlertSim,
} from "../../components/dashboard/UsageAlertModal";
import {
  preferencesService,
  DEFAULT_PREFERENCES,
  UserPreferences,
} from "../../services/preferences";

const HomePage: FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topConsumers, setTopConsumers] = useState<TopConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [consumerPeriod, setConsumerPeriod] = useState<"week" | "month">(
    "month",
  );

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: "success" | "error" | "info" | "warning"}>({open: false, message: "", severity: "error"});

  // Alert modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState<AlertSim[]>([]);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Expose modal opener globally for notification click
  useEffect(() => {
    (window as any).openAlertModal = async () => {
      // Re-fetch latest alerts when opened from notification
      try {
        const prefs = await preferencesService.getPreferences();
        const warningThreshold = prefs.warning_threshold / 100;
        const criticalThreshold = prefs.critical_threshold / 100;

        const [warningAlerts, criticalAlerts, projectedAlerts] =
          await Promise.all([
            reportService.getAlerts(warningThreshold),
            reportService.getAlerts(criticalThreshold),
            reportService.getProjectedAlerts(prefs.projected_threshold / 100),
          ]);

        // Combine and deduplicate alerts
        const allAlerts = [...criticalAlerts.alerts, ...warningAlerts.alerts];
        const uniqueAlerts = Array.from(
          new Map(allAlerts.map((alert: any) => [alert.iccid, alert])).values(),
        );

        // Add projected alerts
        const projectedAlertsWithFlag = projectedAlerts.alerts.map(
          (alert: any) => ({
            ...alert,
            isProjected: true,
            projectedPercent: alert.projectedPercent,
            usagePercent: alert.currentPercent, // Use current percent for sorting
          }),
        );

        // Merge projected alerts
        projectedAlertsWithFlag.forEach((projected: any) => {
          const existing = uniqueAlerts.find(
            (a: any) => a.iccid === projected.iccid,
          );
          if (!existing) {
            uniqueAlerts.push(projected);
          } else {
            (existing as any).isProjected = true;
            (existing as any).projectedPercent = projected.projectedPercent;
          }
        });

        // Filter to only include alerts within threshold range
        const filteredAlerts = uniqueAlerts.filter((alert: any) => {
          const usage = parseFloat(alert.usagePercent);
          return usage >= prefs.warning_threshold;
        });

        if (filteredAlerts.length > 0) {
          setAlertData(filteredAlerts);
          setPreferences(prefs);
          setShowAlertModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };
    return () => {
      delete (window as any).openAlertModal;
    };
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Fetching dashboard data...");
      console.log("API URL:", process.env.REACT_APP_API_URL);

      const [statsData, consumersData] = await Promise.all([
        dashboardService.getStats(0.8),
        dashboardService.getTopConsumers(10, consumerPeriod),
      ]);

      console.log("✅ Stats received:", statsData);
      console.log("✅ Consumers received:", consumersData);

      setStats(statsData);
      setTopConsumers(consumersData);
    } catch (error: any) {
      console.error("❌ Error fetching dashboard data:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      setSnackbar({ open: true, message: "Failed to fetch data: " + (error.message || "Unknown error"), severity: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await preferencesService.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error("Failed to load preferences:", error);
        setPreferences(DEFAULT_PREFERENCES);
      }
    };
    loadPreferences();
  }, []);

  // Check and show alert modal on data load
  useEffect(() => {
    const checkAlerts = async () => {
      console.log("🔔 Checking alerts...", {
        stats: stats?.alerts,
        preferences,
        alerts_enabled: preferences?.alerts_enabled,
      });

      if (!stats || !preferences || !preferences.alerts_enabled) {
        console.log("⏭️ Skipping alert check:", {
          hasStats: !!stats,
          hasPreferences: !!preferences,
          alertsEnabled: preferences?.alerts_enabled,
        });
        return;
      }

      // Check if modal was already shown today
      const lastShown = localStorage.getItem("alertModalLastShown");
      const today = new Date().toDateString();

      console.log("📅 Alert modal check:", {
        lastShown,
        today,
        shouldSkip: lastShown === today,
      });

      if (lastShown === today) {
        console.log("✅ Alert modal already shown today");
        return; // Already shown today
      }

      if (stats.alerts > 0) {
        console.log(`⚠️ Found ${stats.alerts} alerts, fetching details...`);
        try {
          // Fetch alerts for both thresholds
          const warningThreshold = preferences.warning_threshold / 100;
          const criticalThreshold = preferences.critical_threshold / 100;

          // Fetch both current usage and projected usage alerts
          const [warningAlerts, criticalAlerts, projectedAlerts] =
            await Promise.all([
              reportService.getAlerts(warningThreshold),
              reportService.getAlerts(criticalThreshold),
              reportService.getProjectedAlerts(
                preferences.projected_threshold / 100,
              ),
            ]);

          console.log("📊 Alert results:", {
            warningCount: warningAlerts.count,
            criticalCount: criticalAlerts.count,
            projectedCount: projectedAlerts.count,
          });

          // Combine and deduplicate alerts
          const allAlerts = [...criticalAlerts.alerts, ...warningAlerts.alerts];
          const uniqueAlerts = Array.from(
            new Map(allAlerts.map((alert) => [alert.iccid, alert])).values(),
          );

          // Add projected alerts (mark them as projected)
          const projectedAlertsWithFlag = projectedAlerts.alerts.map(
            (alert: any) => ({
              ...alert,
              isProjected: true,
              projectedPercent: alert.projectedPercent,
            }),
          );

          // Merge projected alerts with unique alerts (avoid duplicates)
          projectedAlertsWithFlag.forEach((projected: any) => {
            const existing = uniqueAlerts.find(
              (a) => a.iccid === projected.iccid,
            );
            if (!existing) {
              uniqueAlerts.push(projected);
            } else {
              // Add projected info to existing alert
              (existing as any).isProjected = true;
              (existing as any).projectedPercent = projected.projectedPercent;
            }
          });

          // Filter to only include alerts within our threshold range
          const filteredAlerts = uniqueAlerts.filter((alert) => {
            const usage = parseFloat(alert.usagePercent);
            return usage >= preferences.warning_threshold;
          });

          console.log(
            `✨ Filtered alerts: ${filteredAlerts.length} SIMs to display`,
          );

          if (filteredAlerts.length > 0) {
            setAlertData(filteredAlerts);
            setShowAlertModal(true);
            localStorage.setItem("alertModalLastShown", today);
            console.log("🚀 Alert modal opened!");
          } else {
            console.log("ℹ️ No alerts match the threshold criteria");
          }
        } catch (error) {
          console.error("❌ Failed to fetch alert details:", error);
        }
      } else {
        console.log("✅ No alerts to display");
      }
    };

    checkAlerts();
  }, [stats, preferences]);

  useEffect(() => {
    fetchData();
  }, [consumerPeriod]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(
      () => {
        fetchData();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    fetchData();
  };

  const handleAlertsClick = async () => {
    if (!stats?.alerts || stats.alerts === 0) return;

    try {
      const warningThreshold = preferences.warning_threshold / 100;
      const criticalThreshold = preferences.critical_threshold / 100;

      const [warningAlerts, criticalAlerts] = await Promise.all([
        reportService.getAlerts(warningThreshold),
        reportService.getAlerts(criticalThreshold),
      ]);

      const allAlerts = [...criticalAlerts.alerts, ...warningAlerts.alerts];
      const uniqueAlerts = Array.from(
        new Map(allAlerts.map((alert) => [alert.iccid, alert])).values(),
      );

      const filteredAlerts = uniqueAlerts.filter((alert) => {
        const usage = parseFloat(alert.usagePercent);
        return usage >= preferences.warning_threshold;
      });

      if (filteredAlerts.length > 0) {
        setAlertData(filteredAlerts);
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  return (
    <>
      {/* Usage Alert Modal */}
      <UsageAlertModal
        open={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        alerts={alertData}
        warningThreshold={
          preferences?.warning_threshold ??
          DEFAULT_PREFERENCES.warning_threshold
        }
        criticalThreshold={
          preferences?.critical_threshold ??
          DEFAULT_PREFERENCES.critical_threshold
        }
        warningColor={
          preferences?.warning_color ?? DEFAULT_PREFERENCES.warning_color
        }
        criticalColor={
          preferences?.critical_color ?? DEFAULT_PREFERENCES.critical_color
        }
      />

      <PageLayout
        title="SIM Card Dashboard"
        actions={
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              width: "100%",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<IconRefresh />}
              onClick={handleManualRefresh}
              disabled={refreshing}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "contained" : "outlined"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Auto-Refresh: {autoRefresh ? "ON" : "OFF"}
            </Button>
          </Box>
        }
      >
        <Grid container spacing={3} mt={0}>
          {/* KPI Cards - 4 cards for perfect grid layout */}
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
              title="Projected Usage"
              value={`${stats?.projectedUsage || 0} GB`}
              icon={<IconTrendingUp size={70} />}
              color={blue[700]}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SmallBox
              elevation={3}
              title="Active Alerts"
              value={stats?.alerts || 0}
              icon={<IconAlertTriangle size={70} />}
              color={red[700]}
              onClick={stats?.alerts ? handleAlertsClick : undefined}
            />
          </Grid>

          {/* Pool Utilization Widget */}
          <Grid item xs={12} sm={6} lg={4}>
            <PoolUtilization
              totalCapacity={parseFloat(
                stats?.poolUtilization.totalCapacity || "0",
              )}
              totalUsed={parseFloat(stats?.poolUtilization.totalUsed || "0")}
              percentage={stats?.poolUtilization.percentage || 0}
              loading={loading}
            />
          </Grid>

          {/* Top Consumers Table */}
          <Grid item xs={12} sm={6} lg={8}>
            <Paper
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <TopConsumersTable
                consumers={topConsumers}
                loading={loading}
                period={consumerPeriod}
                onPeriodChange={setConsumerPeriod}
              />
            </Paper>
          </Grid>

          {/* Monthly Comparison Line Chart */}
          <Grid item xs={12} lg={6}>
            <MonthlyComparisonChart />
          </Grid>

          {/* Monthly Usage Bar Chart */}
          <Grid item xs={12} lg={6}>
            <MonthlyUsageReport />
          </Grid>
        </Grid>
      </PageLayout>
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({...s, open: false}))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default HomePage;
