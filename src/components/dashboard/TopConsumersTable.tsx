import {
  Typography,
  Chip,
  CircularProgress,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IconEye, IconX } from "@tabler/icons-react";
import { FC, useState, useMemo, useCallback } from "react";
import { TopConsumer } from "../../services/simcard";
import { SimUsageGraph } from "./SimUsageGraph";
import { AgGridWrapper, type ColDef } from "../AgGrid";
import type {
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";

interface Props {
  consumers: TopConsumer[];
  loading?: boolean;
  period?: "week" | "month";
  onPeriodChange?: (period: "week" | "month") => void;
}

export const TopConsumersTable: FC<Props> = ({
  consumers,
  loading,
  period = "month",
  onPeriodChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedSim, setSelectedSim] = useState<string | null>(null);

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
        aria-label="view usage history"
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
        headerName: "Used (MB)",
        field: "totalUsed",
        filter: "agNumberColumnFilter",
        type: "numericColumn",
        minWidth: 110,
        valueGetter: (params) => parseFloat(params.data?.totalUsed) || 0,
        valueFormatter: (params: ValueFormatterParams) =>
          params.value != null ? params.value.toFixed(2) : "",
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

  // Handle undefined or null consumers
  const safeConsumers = consumers || [];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography component="h2" variant="h6" color="primary" sx={{ m: 0 }}>
          Top Data Consumers
        </Typography>
        {onPeriodChange && (
          <ButtonGroup size="small" disableElevation>
            <Button
              variant={period === "week" ? "contained" : "outlined"}
              onClick={() => onPeriodChange("week")}
              sx={{
                textTransform: "none",
                fontWeight: period === "week" ? 700 : 400,
                px: 2,
                borderRadius: "20px 0 0 20px",
              }}
            >
              This Week
            </Button>
            <Button
              variant={period === "month" ? "contained" : "outlined"}
              onClick={() => onPeriodChange("month")}
              sx={{
                textTransform: "none",
                fontWeight: period === "month" ? 700 : 400,
                px: 2,
                borderRadius: "0 20px 20px 0",
              }}
            >
              MTD
            </Button>
          </ButtonGroup>
        )}
      </Box>
      {safeConsumers.length === 0 ? (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">No data available</Typography>
        </Box>
      ) : (
        <AgGridWrapper
          autoHeight
          rowData={safeConsumers}
          columnDefs={columnDefs}
          pagination={false}
          getRowId={(params) => params.data.iccid}
        />
      )}

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
    </>
  );
};
