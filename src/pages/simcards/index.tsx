import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { IconEye, IconSearch, IconX } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { PageLayout } from '../../components';
import { simService, SimCard } from '../../services/simcard';
import { SimUsageGraph } from '../../components/dashboard/SimUsageGraph';
import { useSearchParams } from 'react-router-dom';

const SimCardsPage: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [sims, setSims] = useState<SimCard[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSim, setSelectedSim] = useState<string | null>(null);

  // Check for ICCID in URL params and open modal
  useEffect(() => {
    const iccid = searchParams.get('iccid');
    if (iccid) {
      setSelectedSim(iccid);
      setSearchInput(iccid);
      setSearch(iccid);
      // Clear the URL param after opening
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchSims = async () => {
    try {
      setLoading(true);
      const data = await simService.getAll(page + 1, rowsPerPage, search);
      if (data && data.sims) {
        setSims(data.sims);
      } else {
        setSims([]);
      }
      if (data && data.pagination) {
        setTotal(data.pagination.total);
      } else {
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching SIMs:', error);
      setSims([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSims();
  }, [page, rowsPerPage, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'error';
    if (percent >= 80) return 'warning';
    if (percent >= 60) return 'info';
    return 'success';
  };

  return (
    <PageLayout title="SIM Cards Management">
      <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 3 
        }}>
          <TextField
            placeholder="Search by ICCID or MSISDN"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ flexGrow: 1 }}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<IconSearch />}
            onClick={handleSearch}
            sx={{ minWidth: { sm: 120 }, width: { xs: '100%', sm: 'auto' } }}
          >
            Search
          </Button>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 800, sm: 'auto' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>ICCID</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>MSISDN</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Capacity (MB)</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Used (MB)</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Usage %</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Last Connection</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : sims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No SIM cards found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sims.map((sim) => {
                  const usagePercent = parseFloat(sim.usagePercent);
                  return (
                    <TableRow key={sim.iccid} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {sim.iccid}
                        </Typography>
                      </TableCell>
                      <TableCell>{sim.msisdn}</TableCell>
                      <TableCell align="right">{sim.dataSize}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {sim.dataUsed}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${usagePercent.toFixed(1)}%`}
                          size="small"
                          color={getUsageColor(usagePercent)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {sim.lastConnection
                            ? new Date(sim.lastConnection).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setSelectedSim(sim.iccid)}
                        >
                          <IconEye />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows:"
          sx={{
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              display: { xs: 'none', sm: 'block' }
            },
            '.MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              minHeight: { xs: 52, sm: 64 }
            }
          }}
        />
      </Paper>

      {/* SIM Usage Dialog */}
      <Dialog
        open={!!selectedSim}
        onClose={() => setSelectedSim(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                SIM Usage History
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {selectedSim}
              </Typography>
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setSelectedSim(null)}
              aria-label="close"
              sx={{ ml: 1 }}
            >
              <IconX size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSim && <SimUsageGraph iccid={selectedSim} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSelectedSim(null)}
            variant="outlined"
            fullWidth={isMobile}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default SimCardsPage;
