import {
  Box,
  Container,
  CSSObject,
  Divider,
  Drawer,
  styled,
  Theme,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { blue, orange, red } from "@mui/material/colors";
import { IconCircle, IconDashboard, IconPackage, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useRouteLoaderData,
} from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { NavMenu, TMenuItem } from "./NavMenu";
import type { TUser } from "../../services/auth";

export const drawerWidth = 250;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  boxShadow: "10px 4px 32px #4b4b7129",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: theme.spacing(7),
});

const DesktopDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useRouteLoaderData("root") as {
    isAuthenticated: boolean;
    user: TUser | null;
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && location.pathname) {
      const params = new URLSearchParams();
      params.set("from", location.pathname);
      navigate("/auth/login?" + params.toString());
    }
  }, [isAuthenticated, location.pathname]);

  const items: TMenuItem[] = [
    {
      link: "/",
      label: "Dashboard",
      icon: <IconDashboard strokeWidth={1.5} />,
    },
    {
      link: "/simcards",
      label: "SIM Cards",
      icon: <IconPackage strokeWidth={1.5} />,
    },
    {
      link: "/reports",
      label: "Reports & Alerts",
      icon: <IconCircle strokeWidth={1.5} />,
    },
  ];

  // Add admin menu item if user is admin
  if (user?.role === "admin") {
    items.push({
      divider: true,
    });
    items.push({
      link: "/admin/users",
      label: "User Management",
      icon: <IconUsers strokeWidth={1.5} />,
    });
  }

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      if (!isClosing) {
        setMobileOpen(!mobileOpen);
      }
    } else setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppHeader open={open} onMenuClick={handleDrawerToggle} />
      <Box component="nav" sx={{ flexShrink: { sm: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            <Toolbar>
              <Typography
                variant="h6"
                sx={{
                  width: "100%",
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                SIM Dashboard
              </Typography>
            </Toolbar>
            <Divider />
            <NavMenu items={items} isMobile />
          </Drawer>
        ) : (
          <DesktopDrawer variant="permanent" open={open}>
            <Toolbar sx={{ p: "0!important" }}>
              <Typography
                variant="h6"
                sx={{
                  width: "100%",
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                {open ? (
                  <>
                    SIM Dashboard
                  </>
                ) : (
                  "SD"
                )}
              </Typography>
            </Toolbar>
            <Divider />
            <NavMenu items={items} isMimi={!open} />
          </DesktopDrawer>
        )}
      </Box>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          width: isMobile
            ? "100%"
            : `calc(100% - ${open ? drawerWidth + "px" : theme.spacing(7)})`,
          height: "100%",
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Container 
          sx={{ 
            p: isMobile ? "8px 8px 16px" : "12px 26px 26px",
          }} 
          maxWidth="xl"
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
