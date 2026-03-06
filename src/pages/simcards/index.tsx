import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IconEye, IconSearch, IconX } from "@tabler/icons-react";
import { FC, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { PageLayout } from "../../components";
import {
  simService,
  SimCard,
  SimSortModel,
  SimFilterModel,
} from "../../services/simcard";
import { SimUsageGraph } from "../../components/dashboard/SimUsageGraph";
import { useSearchParams } from "react-router-dom";
import {
  AgGridWrapper,
  type ColDef,
  type GridApi,
} from "../../components/AgGrid";
import type {
  IDatasource,
  IGetRowsParams,
  ICellRendererParams,
  ValueFormatterParams,
  GridReadyEvent,
  SortChangedEvent,
  FilterChangedEvent,
} from "ag-grid-community";

const SimCardsPage: FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  // Check for ICCID in URL params and open modal
  useEffect(() => {
    const iccid = searchParams.get("iccid");
    if (iccid) {
      setSelectedSim(iccid);
      setSearchInput(iccid);
      setSearch(iccid);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const getUsageColor = (
    percent: number,
  ): "error" | "warning" | "info" | "success" => {
    if (percent >= 90) return "error";
    if (percent >= 80) return "warning";
    if (percent >= 60) return "info";
    return "success";
  };

  const UsageChipRenderer = useCallback((params: ICellRendererParams) => {
    const val = parseFloat(params.value);
    if (isNaN(val)) return null;
    return (
      <Chip
        label={`${val.toFixed(1)}%`}
        size="small"
        color={getUsageColor(val)}
      />
    );
  }, []);

  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    return (
      <IconButton
        size="small"
        color="primary"
        onClick={() => setSelectedSim(params.data?.iccid)}
      >
        <IconEye size={18} />
      </IconButton>
    );
  }, []);

  const columnDefs = useMemo<ColDef[]>(
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
        headerName: "Capacity (MB)",
        field: "dataSize",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 120,
        valueGetter: (params) => parseFloat(params.data?.dataSize) || 0,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value != null ? params.value.toFixed(2) : "",
      },
      {
        headerName: "Used (MB)",
        field: "dataUsed",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 110,
        valueGetter: (params) => parseFloat(params.data?.dataUsed) || 0,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value != null ? params.value.toFixed(2) : "",
      },
      {
        headerName: "Usage %",
        field: "usagePercent",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 110,
        valueGetter: (params) => parseFloat(params.data?.usagePercent) || 0,
        cellRenderer: UsageChipRenderer,
      },
      {
        headerName: "Last Connection",
        field: "lastConnection",
        filter: "agDateColumnFilter",
        minWidth: 170,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value ? new Date(params.value).toLocaleString() : "N/A",
      },
      {
        headerName: "Actions",
        field: "actions",
        sortable: false,
        filter: false,
        floatingFilter: false,
        resizable: false,
        minWidth: 80,
        maxWidth: 90,
        cellRenderer: ActionsRenderer,
      },
    ],
    [UsageChipRenderer, ActionsRenderer],
  );

  // Create a datasource factory that depends on search
  const createDatasource = useCallback(
    (searchTerm: string): IDatasource => ({
      getRows: async (params: IGetRowsParams) => {
        try {
          const pageSize = params.endRow - params.startRow;
          const page = Math.floor(params.startRow / pageSize) + 1;

          // Extract sort model
          const sortModel: SimSortModel[] = params.sortModel.map((s: any) => ({
            colId: s.colId,
            sort: s.sort,
          }));

          // Extract filter model
          const filterModel: SimFilterModel = params.filterModel || {};

          const data = await simService.getAll(
            page,
            pageSize,
            searchTerm,
            sortModel,
            filterModel,
          );

          if (data && data.sims) {
            const total = data.pagination?.total ?? data.sims.length;
            params.successCallback(data.sims, total);
          } else {
            params.successCallback([], 0);
          }
        } catch (error) {
          console.error("Error fetching SIMs:", error);
          params.failCallback();
        }
      },
    }),
    [],
  );

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
  }, [searchInput]);

  // When search changes, refresh the datasource
  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.setGridOption("datasource", createDatasource(search));
    }
  }, [search, createDatasource]);

  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      event.api.setGridOption("datasource", createDatasource(search));
    },
    [search, createDatasource],
  );

  return (
    <PageLayout title="SIM Cards Management">
      <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            placeholder="Search by ICCID or MSISDN"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            size="small"
            sx={{ flexGrow: 1 }}
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={<IconSearch />}
            onClick={handleSearch}
            sx={{ minWidth: { sm: 120 }, width: { xs: "100%", sm: "auto" } }}
          >
            Search
          </Button>
        </Box>

        <AgGridWrapper
          height={600}
          rowModelType="infinite"
          columnDefs={columnDefs}
          cacheBlockSize={50}
          maxBlocksInCache={10}
          onGridReady={onGridReady}
          rowBuffer={10}
          getRowId={(params) => params.data.iccid}
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
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box flex={1}>
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                SIM Usage History
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
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
