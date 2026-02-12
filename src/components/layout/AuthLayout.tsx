import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Copyright } from "../Copyright";

export function AuthLayout() {
  return (
    <Box
      component="main"
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === "light"
            ? theme.palette.grey[100]
            : theme.palette.grey[900],
        flexGrow: 1,
        minHeight: "100vh",
      }}
    >
      <Container maxWidth="xs" sx={{ minHeight: "100vh" }}>
        <Stack
          spacing={2}
          sx={{
            minHeight: "100vh",
            p: { xs: 1, sm: 2 },
            overflow: "auto",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              mb: { xs: 1, sm: 2 },
              textAlign: "center",
              color: "text.secondary",
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            SIM Dashboard
          </Typography>
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 } }}>
            <Outlet />
          </Paper>
          <Copyright />
        </Stack>
      </Container>
    </Box>
  );
}
