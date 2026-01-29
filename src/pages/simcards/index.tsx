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
} from '@mui/material';
import { IconEye, IconSearch } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';
import { PageLayout } from '../../components';
import { simService, SimCard } from '../../services/simcard';
import { SimUsageGraph } from '../../components/dashboard/SimUsageGraph';

const SimCardsPage: FC = () => {
  const [sims, setSims] = useState<SimCard[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSim, setSelectedSim] = useState<string | null>(null);

  const fetchSims = async () => {
    try {
      setLoading(true);
      const data = await simService.getAll(page + 1, rowsPerPage, search);
      setSims(data.sims);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching SIMs:', error);
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
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search by ICCID or MSISDN"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<IconSearch />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ICCID</TableCell>
                <TableCell>MSISDN</TableCell>
                <TableCell align="right">Capacity (MB)</TableCell>
                <TableCell align="right">Used (MB)</TableCell>
                <TableCell align="right">Usage %</TableCell>
                <TableCell>Last Connection</TableCell>
                <TableCell align="center">Actions</TableCell>
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
        />
      </Paper>

      {/* SIM Usage Dialog */}
      <Dialog
        open={!!selectedSim}
        onClose={() => setSelectedSim(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          SIM Usage History: {selectedSim}
        </DialogTitle>
        <DialogContent>
          {selectedSim && <SimUsageGraph iccid={selectedSim} />}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default SimCardsPage;
