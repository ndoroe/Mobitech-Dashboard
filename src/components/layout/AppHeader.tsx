import {
  AppBar,
  AppBarProps,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  styled,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  IconAlertTriangle,
  IconMenu2,
} from "@tabler/icons-react";
import { FC, ReactNode, useEffect, useState } from "react";
import { To, useNavigate } from "react-router-dom";
import { FullscreenButton } from "../FullscreenButton";
import { drawerWidth } from "./AppLayout";
import { Notifications } from "./Notifications";
import { UserMenu } from "./UserMenu";
import { notificationService } from "../../services/notifications";

type TTopNav = {
  label: string;
  link?: To;
};

type TNotification = {
  icon: ReactNode;
  count: number;
  text: string;
  lastUpdated: string;
  onClick?: () => void;
};

const pages: TTopNav[] = [
  { label: "Home", link: "/" },
];

interface DesktopAppBarProps extends AppBarProps {
  open?: boolean;
}

const DesktopAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<DesktopAppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(!open && {
    marginLeft: theme.spacing(7),
    width: `calc(100% - ${theme.spacing(7)})`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

interface Props extends AppBarProps {
  open?: boolean;
  onMenuClick: () => void;
}

export const AppHeader: FC<Props> = ({
  open,
  onMenuClick,
  position,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  // State for dynamic notifications
  const [notifications, setNotifications] = useState<TNotification[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch alert notifications
  const fetchNotifications = async () => {
    try {
      const alertSummary = await notificationService.getAlertSummary();
      
      const notificationList: TNotification[] = [];
      
      // Add SIM usage alerts if any
      if (alertSummary.count > 0) {
        notificationList.push({
          icon: <IconAlertTriangle size={20} />,
          count: alertSummary.count,
          text: "SIM usage alerts",
          lastUpdated: notificationService.formatLastUpdated(alertSummary.lastUpdated),
          onClick: () => {
            // Try to open the alert modal if on home page
            if (typeof (window as any).openAlertModal === 'function') {
              (window as any).openAlertModal();
            } else {
              // Otherwise navigate to reports
              navigate('/reports');
            }
          },
        });
      }
      
      setNotifications(notificationList);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Poll for notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const menuButton = (
    <IconButton
      color="inherit"
      aria-label="open drawer"
      edge="start"
      onClick={onMenuClick}
      sx={{ mr: 2 }}
    >
      <IconMenu2 />
    </IconButton>
  );

  if (isMobile) {
    return (
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          // background: (theme) => theme.palette.background.paper,
          // color: (theme) => theme.palette.text.primary,
          ...sx,
        }}
        {...props}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          {menuButton}
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} flexGrow={0}>
            <Notifications />
            <UserMenu />
          </Stack>
        </Toolbar>
        <Divider />
      </AppBar>
    );
  }

  return (
    <DesktopAppBar
      open={open}
      position="fixed"
      elevation={0}
      sx={{
        //background: (theme) => theme.palette.background.paper,
        //color: (theme) => theme.palette.text.primary,
        ...sx,
      }}
      {...props}
    >
      <Toolbar>
        {menuButton}
        <Stack direction="row" spacing={1} flexGrow={1}>
          {pages.map((page, index) => (
            <Button
              key={index}
              onClick={() => page.link && navigate(page.link)}
              sx={{ color: "inherit", fontWeight: 400 }}
            >
              {page.label}
            </Button>
          ))}
        </Stack>
        <Stack direction="row" spacing={2} flexGrow={0}>
          <Notifications />
          <FullscreenButton />
          <UserMenu />
        </Stack>
      </Toolbar>
      <Divider />
    </DesktopAppBar>
  );
};
