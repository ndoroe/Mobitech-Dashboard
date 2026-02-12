import {
  Box,
  Stack,
  BoxProps,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FC, ReactNode } from "react";
import { PageBreadcrumbs } from "./PageBreadcrumbs";

interface Props extends Omit<BoxProps, "title"> {
  title?: string | ReactNode;
  breadcrumbTitle?: string | ReactNode;
  actions?: ReactNode;
}

export const PageLayout: FC<Props> = ({
  title,
  breadcrumbTitle,
  actions,
  children,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box {...props}>
      <Stack
        direction={isMobile ? "column" : "row"}
        alignItems={isMobile ? "flex-start" : "center"}
        justifyContent="space-between"
        spacing={isMobile ? 1 : 2}
        sx={{ mb: { xs: 1, sm: 2 } }}
      >
        {typeof title === "string" ? (
          <Typography 
            component="h1" 
            fontSize={{ xs: "1.5rem", sm: "1.8rem" }}
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
        ) : (
          title
        )}
        {actions ? (
          <Box sx={{ width: isMobile ? '100%' : 'auto' }}>
            {actions}
          </Box>
        ) : (
          <PageBreadcrumbs title={breadcrumbTitle || title} />
        )}
      </Stack>
      {children}
    </Box>
  );
};
