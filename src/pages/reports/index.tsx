import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  Chip,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  IconDownload,
  IconFileAnalytics,
  IconChartBar,
} from "@tabler/icons-react";
import { FC, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PageLayout } from "../../components";
import { reportService } from "../../services/simcard";
import FilterBuilder, { Filter } from "../../components/reports/FilterBuilder";
import MonthlyUsageReport from "../../components/dashboard/MonthlyUsageReport";
import {
  AgGridWrapper,
  type ColDef,
  type GridApi,
} from "../../components/AgGrid";
import type {
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import axios from "axios";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsPage: FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Basic Report Builder State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("day");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Report Builder State
  const [dynamicStartDate, setDynamicStartDate] = useState("");
  const [dynamicEndDate, setDynamicEndDate] = useState("");
  const [dynamicGroupBy, setDynamicGroupBy] = useState("none");
  const [uniqueIccid, setUniqueIccid] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "iccid",
    "msisdn",
    "dataUsed",
    "dataSize",
    "usagePercent",
  ]);

  // Alerts State
  const [alertThreshold, setAlertThreshold] = useState(0.8);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: "success" | "error" | "info" | "warning"}>({open: false, message: "", severity: "error"});

  // AG Grid API refs for CSV export
  const basicGridApiRef = useRef<GridApi | null>(null);
  const dynamicGridApiRef = useRef<GridApi | null>(null);

  // Fetch metadata for dynamic report builder
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metadata = await reportService.getMetadata();
        if (metadata && metadata.fields) {
          setAvailableFields(metadata.fields);
        }
        if (metadata && metadata.operators) {
          setAvailableOperators(metadata.operators);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.generateCustomReport({
        startDate,
        endDate,
        groupBy,
      });
      setReportData(data.report);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDynamicReport = async () => {
    try {
      setLoading(true);

      // Transform filters to API format
      const apiFilters = filters.map((f) => ({
        field: f.field,
        operator: f.operator,
        value: f.value,
      }));

      const result = await reportService.generateDynamicReport({
        metrics: selectedMetrics.length > 0 ? selectedMetrics : undefined,
        filters: apiFilters,
        groupBy: dynamicGroupBy,
        startDate: dynamicStartDate || undefined,
        endDate: dynamicEndDate || undefined,
        uniqueIccid,
        sortBy: sortBy || undefined,
        sortOrder,
        limit: 1000,
      });

      setReportData(result.report);
    } catch (error: any) {
      console.error("Error generating dynamic report:", error);
      setSnackbar({ open: true, message: error.response?.data?.message || "Error generating report", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await reportService.getAlerts(alertThreshold);
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (gridApi?: GridApi | null) => {
    const api = gridApi;
    if (api) {
      api.exportDataAsCsv({
        fileName: `sim-report-${new Date().toISOString()}.csv`,
      });
      return;
    }
    // Fallback: manual CSV if no grid api
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.map((row) =>
        headers.map((header) => row[header]).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sim-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  /** Build AG Grid ColDefs dynamically from report data keys */
  const buildDynamicColDefs = useCallback((data: any[]): ColDef[] => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map((key) => {
      const sampleVal = data[0][key];
      const isNumeric =
        typeof sampleVal === "number" ||
        (!isNaN(parseFloat(sampleVal)) && key !== "iccid" && key !== "msisdn");
      const isDate =
        key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("connection") ||
        key.toLowerCase().includes("time");

      const col: ColDef = {
        headerName: key,
        field: key,
        minWidth: 120,
      };

      if (key === "iccid" || key === "msisdn") {
        col.filter = "agTextColumnFilter";
        if (key === "iccid") {
          col.cellStyle = { fontFamily: "monospace" };
          col.minWidth = 180;
        }
      } else if (isDate) {
        col.filter = "agDateColumnFilter";
        col.valueFormatter = (params: ValueFormatterParams) =>
          params.value ? new Date(params.value).toLocaleString() : "";
      } else if (isNumeric) {
        col.filter = "agNumberColumnFilter";
        col.type = "numericColumn";
        if (!key.includes("Count")) {
          col.valueGetter = (params) => {
            const v = params.data?.[key];
            return typeof v === "number" ? v : parseFloat(v) || 0;
          };
          col.valueFormatter = (params: ValueFormatterParams) =>
            params.value != null ? Number(params.value).toFixed(2) : "";
        }
      } else {
        col.filter = "agTextColumnFilter";
      }
      return col;
    });
  }, []);

  /** Build fixed ColDefs for the Alerts table */
  const alertColDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "ICCID",
        field: "iccid",
        filter: "agTextColumnFilter",
        minWidth: 180,
        cellStyle: { fontFamily: "monospace" },
      },
      {
        headerName: "MSISDN",
        field: "msisdn",
        filter: "agTextColumnFilter",
        minWidth: 130,
      },
      {
        headerName: "Used (MB)",
        field: "dataUsed",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 110,
        valueGetter: (p) => parseFloat(p.data?.dataUsed) || 0,
        valueFormatter: (p: ValueFormatterParams) =>
          p.value != null ? p.value.toFixed(2) : "",
      },
      {
        headerName: "Capacity (MB)",
        field: "dataSize",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 120,
        valueGetter: (p) => parseFloat(p.data?.dataSize) || 0,
        valueFormatter: (p: ValueFormatterParams) =>
          p.value != null ? p.value.toFixed(2) : "",
      },
      {
        headerName: "Usage %",
        field: "usagePercent",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 110,
        valueGetter: (p) => parseFloat(p.data?.usagePercent) || 0,
        cellRenderer: (params: ICellRendererParams) => {
          const val = parseFloat(params.value);
          if (isNaN(val)) return null;
          return (
            <Chip label={`${val.toFixed(1)}%`} size="small" color="error" />
          );
        },
      },
      {
        headerName: "Last Connection",
        field: "lastConnection",
        filter: "agDateColumnFilter",
        minWidth: 170,
        valueFormatter: (p: ValueFormatterParams) =>
          p.value ? new Date(p.value).toLocaleString() : "N/A",
      },
    ],
    [],
  );

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric],
    );
  };

  return (<>
    <PageLayout title="Reports & Analytics">
      <Box sx={{ borderBottom: 1, borderColor: "divider", overflowX: "auto" }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            label="Basic"
            icon={<IconFileAnalytics size={18} />}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab
            label="Dynamic"
            icon={<IconFileAnalytics size={18} />}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab
            label="Monthly"
            icon={<IconChartBar size={18} />}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
          <Tab
            label="Alerts"
            icon={<IconFileAnalytics size={18} />}
            iconPosition="start"
            sx={{ minHeight: { xs: 48, sm: 64 } }}
          />
        </Tabs>
      </Box>

      {/* Basic Report Builder Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Report Configuration
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Group By</InputLabel>
                        <Select
                          value={groupBy}
                          label="Group By"
                          onChange={(e) => setGroupBy(e.target.value)}
                        >
                          <MenuItem value="none">Raw Data</MenuItem>
                          <MenuItem value="day">Daily</MenuItem>
                          <MenuItem value="month">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleGenerateReport}
                        disabled={loading}
                      >
                        Generate Report
                      </Button>
                    </Grid>
                    {reportData.length > 0 && (
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<IconDownload />}
                          onClick={() => exportToCSV(basicGridApiRef.current)}
                        >
                          Export to CSV
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Report Results */}
          <Grid item xs={12} md={8}>
            {reportData.length > 0 ? (
              <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, px: 1 }}
                >
                  Report Results ({reportData.length} records)
                </Typography>
                <AgGridWrapper
                  height={500}
                  rowData={reportData}
                  columnDefs={buildDynamicColDefs(reportData)}
                  onGridReady={(e) => {
                    basicGridApiRef.current = e.api;
                  }}
                />
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Configure your report and click "Generate Report" to view
                  results
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Dynamic Report Builder Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Select Metrics
                </Typography>
                <FormGroup
                  row
                  sx={{
                    "& .MuiFormControlLabel-root": { mr: { xs: 1, sm: 2 } },
                  }}
                >
                  {availableFields.map((field) => (
                    <FormControlLabel
                      key={field.name}
                      control={
                        <Checkbox
                          checked={selectedMetrics.includes(field.name)}
                          onChange={() => handleMetricToggle(field.name)}
                          size="small"
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                        >
                          {field.label}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <FilterBuilder
              filters={filters}
              onFiltersChange={setFilters}
              availableFields={availableFields}
              availableOperators={availableOperators}
            />
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                >
                  Additional Options
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={dynamicStartDate}
                      onChange={(e) => setDynamicStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={dynamicEndDate}
                      onChange={(e) => setDynamicEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Group By</InputLabel>
                      <Select
                        value={dynamicGroupBy}
                        label="Group By"
                        onChange={(e) => setDynamicGroupBy(e.target.value)}
                      >
                        <MenuItem value="none">No Grouping</MenuItem>
                        <MenuItem value="day">Daily</MenuItem>
                        <MenuItem value="month">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <MenuItem value="">Default (createdTime)</MenuItem>
                        <MenuItem value="iccid">ICCID</MenuItem>
                        <MenuItem value="msisdn">MSISDN</MenuItem>
                        <MenuItem value="dataUsed">Data Used</MenuItem>
                        <MenuItem value="dataSize">Data Size</MenuItem>
                        <MenuItem value="usagePercent">Usage %</MenuItem>
                        <MenuItem value="lastConnection">
                          Last Connection
                        </MenuItem>
                        <MenuItem value="createdTime">Created Time</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Sort Order</InputLabel>
                      <Select
                        value={sortOrder}
                        label="Sort Order"
                        onChange={(e) =>
                          setSortOrder(e.target.value as "asc" | "desc")
                        }
                      >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={uniqueIccid}
                          onChange={(e) => setUniqueIccid(e.target.checked)}
                        />
                      }
                      label="Unique ICCID (Latest Only)"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleGenerateDynamicReport}
                        disabled={loading}
                        fullWidth
                      >
                        Generate Dynamic Report
                      </Button>
                      {reportData.length > 0 && (
                        <Button
                          variant="outlined"
                          startIcon={<IconDownload />}
                          onClick={() => exportToCSV(dynamicGridApiRef.current)}
                          fullWidth
                        >
                          Export CSV
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dynamic Report Results */}
          <Grid item xs={12}>
            {reportData.length > 0 ? (
              <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, px: 1 }}
                >
                  Report Results ({reportData.length} records)
                </Typography>
                <AgGridWrapper
                  height={500}
                  rowData={reportData}
                  columnDefs={buildDynamicColDefs(reportData)}
                  onGridReady={(e) => {
                    dynamicGridApiRef.current = e.api;
                  }}
                />
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Configure metrics and filters, then click "Generate Dynamic
                  Report"
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Monthly Usage Report Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MonthlyUsageReport />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Alerts Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Configuration
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Alert Threshold (%)"
                        type="number"
                        value={alertThreshold * 100}
                        onChange={(e) =>
                          setAlertThreshold(parseFloat(e.target.value) / 100)
                        }
                        inputProps={{ min: 0, max: 100, step: 5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Alert when usage exceeds this percentage
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={handleFetchAlerts}
                        disabled={loading}
                        sx={{ height: "56px" }}
                      >
                        Check Alerts
                      </Button>
                    </Grid>
                    {alerts.length > 0 && (
                      <Grid item xs={12} md={4}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            height: "56px",
                            px: 2,
                            bgcolor: "error.light",
                            color: "error.contrastText",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            {alerts.length} SIM card(s) exceeded threshold
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alerts Table - Full Width Below */}
          <Grid item xs={12}>
            {alerts.length > 0 ? (
              <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  color="error"
                  sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, px: 1 }}
                >
                  Active Alerts
                </Typography>
                <AgGridWrapper
                  height={500}
                  rowData={alerts}
                  columnDefs={alertColDefs}
                  getRowId={(params) => params.data.iccid}
                />
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  Configure threshold and click "Check Alerts" to view SIM cards
                  exceeding usage limits
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>
    </PageLayout>
    <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({...s, open: false}))} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
      <Alert onClose={() => setSnackbar(s => ({...s, open: false}))} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  </>);
};

export default ReportsPage;
