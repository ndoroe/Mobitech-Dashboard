import { FC, useMemo, useRef, useCallback } from "react";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  ClientSideRowModelModule,
  InfiniteRowModelModule,
  type ColDef,
  type GridReadyEvent,
  type GridApi,
} from "ag-grid-community";
import { Box } from "@mui/material";

// Register all community modules once
ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  InfiniteRowModelModule,
]);

// Custom AG Grid theme that matches MUI default palette
export const agGridMuiTheme = themeQuartz.withParams({
  accentColor: "#1976d2",
  headerBackgroundColor: "#f5f5f5",
  headerTextColor: "#333",
  rowHoverColor: "rgba(25, 118, 210, 0.04)",
  selectedRowBackgroundColor: "rgba(25, 118, 210, 0.08)",
  borderColor: "#e0e0e0",
  fontSize: 14,
  headerFontSize: 14,
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  // Custom checkbox color is now in global CSS
});

/** Default column definition with sort + filter enabled */
export const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true,
  minWidth: 80,
  flex: 1,
};

interface AgGridWrapperProps extends AgGridReactProps {
  height?: number | string;
  autoHeight?: boolean;
}

/**
 * Reusable AG Grid wrapper with MUI-themed styling.
 * Forwards all AgGridReact props and wraps in a sized container.
 */
export const AgGridWrapper: FC<AgGridWrapperProps> = ({
  height = 500,
  autoHeight = false,
  ...gridProps
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: autoHeight ? undefined : height,
        "& .ag-root-wrapper": {
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
        },
      }}
    >
      <AgGridReact
        theme={agGridMuiTheme}
        defaultColDef={defaultColDef}
        animateRows={true}
        domLayout={autoHeight ? "autoHeight" : "normal"}
        pagination={false}
        {...gridProps}
      />
    </Box>
  );
};

export { AgGridReact };
export type { ColDef, GridReadyEvent, GridApi };
