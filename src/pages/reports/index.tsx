import {
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { IconDownload, IconFileAnalytics, IconChartBar } from '@tabler/icons-react';
import { FC, useState, useEffect } from 'react';
import { PageLayout } from '../../components';
import { reportService } from '../../services/simcard';
import FilterBuilder, { Filter } from '../../components/reports/FilterBuilder';
import MonthlyUsageReport from '../../components/dashboard/MonthlyUsageReport';
import axios from 'axios';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dynamic Report Builder State
  const [dynamicStartDate, setDynamicStartDate] = useState('');
  const [dynamicEndDate, setDynamicEndDate] = useState('');
  const [dynamicGroupBy, setDynamicGroupBy] = useState('none');
  const [uniqueIccid, setUniqueIccid] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [availableOperators, setAvailableOperators] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'iccid',
    'msisdn',
    'dataUsed',
    'dataSize',
    'usagePercent',
  ]);
  
  // Alerts State
  const [alertThreshold, setAlertThreshold] = useState(0.8);
  const [alerts, setAlerts] = useState<any[]>([]);

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
        console.error('Error fetching metadata:', error);
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
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDynamicReport = async () => {
    try {
      setLoading(true);
      
      // Transform filters to API format
      const apiFilters = filters.map(f => ({
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
      console.error('Error generating dynamic report:', error);
      alert(error.response?.data?.message || 'Error generating report');
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
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sim-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <PageLayout title="Reports & Analytics">
      <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
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
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                          onClick={exportToCSV}
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
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, px: 1 }}>
                  Report Results ({reportData.length} records)
                </Typography>
                <TableContainer sx={{ maxHeight: 500, overflowX: 'auto' }}>
                  <Table stickyHeader size="small" sx={{ minWidth: { xs: 600, sm: 'auto' } }}>
                    <TableHead>
                      <TableRow>
                        {Object.keys(reportData[0]).map((key) => (
                          <TableCell key={key} sx={{ whiteSpace: 'nowrap', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {key}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.slice(0, 100).map((row, idx) => (
                        <TableRow key={idx} hover>
                          {Object.values(row).map((value: any, cellIdx) => (
                            <TableCell key={cellIdx} sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                              {value instanceof Date ? value.toLocaleString() : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {reportData.length > 100 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 100 records. Export to CSV for full data.
                  </Typography>
                )}
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Configure your report and click "Generate Report" to view results
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
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Select Metrics
                </Typography>
                <FormGroup row sx={{ '& .MuiFormControlLabel-root': { mr: { xs: 1, sm: 2 } } }}>
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
                      label={<Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{field.label}</Typography>}
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
                <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                        <MenuItem value="lastConnection">Last Connection</MenuItem>
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
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
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
                    <Box sx={{ display: 'flex', gap: 2 }}>
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
                          onClick={exportToCSV}
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
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Report Results ({reportData.length} records)
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(reportData[0]).map((key) => (
                          <TableCell key={key}>
                            <strong>{key}</strong>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.map((row, idx) => (
                        <TableRow key={idx} hover>
                          {Object.entries(row).map(([key, value]: [string, any], cellIdx) => (
                            <TableCell key={cellIdx}>
                              {value instanceof Date 
                                ? value.toLocaleString() 
                                : typeof value === 'number' && !key.includes('Count')
                                ? value.toFixed(2)
                                : String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Configure metrics and filters, then click "Generate Dynamic Report"
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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Configuration
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Alert Threshold (%)"
                        type="number"
                        value={alertThreshold * 100}
                        onChange={(e) => setAlertThreshold(parseFloat(e.target.value) / 100)}
                        inputProps={{ min: 0, max: 100, step: 5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Alert when usage exceeds this percentage
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={handleFetchAlerts}
                        disabled={loading}
                      >
                        Check Alerts
                      </Button>
                    </Grid>
                  </Grid>
                  {alerts.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" color="error">
                        {alerts.length} SIM card(s) exceeded threshold
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alerts Table */}
          <Grid item xs={12} md={8}>
            {alerts.length > 0 ? (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Active Alerts
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
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
                      {alerts.map((alert) => (
                        <TableRow key={alert.iccid} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {alert.iccid}
                          </TableCell>
                          <TableCell>{alert.msisdn}</TableCell>
                          <TableCell align="right">{alert.dataUsed}</TableCell>
                          <TableCell align="right">{alert.dataSize}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${parseFloat(alert.usagePercent).toFixed(1)}%`}
                              size="small"
                              color="error"
                            />
                          </TableCell>
                          <TableCell>
                            {alert.lastConnection
                              ? new Date(alert.lastConnection).toLocaleString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Configure threshold and click "Check Alerts" to view SIM cards exceeding usage limits
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>
    </PageLayout>
  );
};

export default ReportsPage;
