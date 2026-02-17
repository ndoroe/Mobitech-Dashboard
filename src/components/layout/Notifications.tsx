import {
  Badge,
  Divider,
  IconButton,
  IconButtonProps,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { IconBell, IconUser, IconAlertTriangle } from "@tabler/icons-react";
import { FC, MouseEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { authProvider } from "../../services/auth";
import { notificationService } from "../../services/notifications";

interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  user_username: string;
  user_email: string;
}

interface AlertNotification {
  type: 'alert';
  count: number;
  message: string;
  onClick: () => void;
}

interface Props extends Omit<IconButtonProps, 'onClick'> {}

export const Notifications: FC<Props> = ({ color, ...props }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  // Check if current user is admin
  const isAdmin = authProvider.user?.role === "admin";

  useEffect(() => {
    // Fetch both admin notifications and alerts
    fetchAllNotifications();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchAllNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const fetchAllNotifications = async () => {
    // Fetch admin notification count if admin
    if (isAdmin) {
      fetchUnreadCount();
    }
    
    // Fetch alert count for all users
    fetchAlertCount();
  };

  const fetchUnreadCount = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await api.get("/notifications/count");
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const fetchAlertCount = async () => {
    try {
      // Check if alerts were recently dismissed
      const dismissedAt = localStorage.getItem('alerts_dismissed_at');
      if (dismissedAt) {
        const dismissedTime = new Date(dismissedAt).getTime();
        const now = new Date().getTime();
        const hoursSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60);
        
        // Keep alerts dismissed for 6 hours
        if (hoursSinceDismissal < 6) {
          setAlertCount(0);
          return;
        }
      }
      
      const alertSummary = await notificationService.getAlertSummary();
      setAlertCount(alertSummary.count || 0);
    } catch (error) {
      console.error("Error fetching alert count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await api.get("/notifications", {
        params: { limit: 10 },
      });
      setNotifications(response.data.data || []);
      
      // Count read notifications
      const readNotifications = (response.data.data || []).filter((n: Notification) => n.read);
      setReadCount(readNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    if (isAdmin) {
      await fetchNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await api.post(`/notifications/${notification.id}/read`);
        await fetchUnreadCount();
      }

      // Navigate to user management page
      if (notification.type === "new_registration") {
        navigate("/admin/users?tab=1"); // Tab 1 is "Pending Approval"
      }

      handleClose();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      await fetchUnreadCount();
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleClearRead = async () => {
    try {
      // Clear admin notifications
      await api.delete("/notifications/clear-read");
      await fetchUnreadCount();
      await fetchNotifications();
      
      // Also dismiss alert notifications
      setAlertCount(0);
      // Store dismissal with current timestamp
      localStorage.setItem('alerts_dismissed_at', new Date().toISOString());
    } catch (error) {
      console.error("Error clearing read notifications:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Don't show notifications bell for non-admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <IconButton
        color={color || "inherit"}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        {...props}
      >
        <Badge badgeContent={unreadCount + alertCount} color="error">
          <IconBell strokeWidth={1.5} />
        </Badge>
      </IconButton>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuList sx={{ width: { xs: 280, sm: 360 }, p: 0, maxHeight: { xs: '70vh', sm: 500 }, overflowY: 'auto' }}>
          <MenuItem>
            <ListItemText sx={{ textAlign: "center", color: "text.secondary" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" px={1}>
                <Typography variant="body2">
                  {unreadCount} Unread Notification{unreadCount !== 1 ? "s" : ""}
                </Typography>
                <Box display="flex" gap={1.5}>
                  {unreadCount > 0 && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllAsRead();
                      }}
                    >
                      Mark all read
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color={readCount > 0 || alertCount > 0 ? "error" : "text.disabled"}
                    sx={{ cursor: readCount > 0 || alertCount > 0 ? "pointer" : "default" }}
                    onClick={(e) => {
                      if (readCount > 0 || alertCount > 0) {
                        e.stopPropagation();
                        handleClearRead();
                      }
                    }}
                  >
                    Clear all
                  </Typography>
                </Box>
              </Box>
            </ListItemText>
          </MenuItem>
          <Divider />
          
          {/* Alert Notifications */}
          {alertCount > 0 && (
            <MenuItem
              onClick={() => {
                // Try to open the alert modal if on home page
                if (typeof (window as any).openAlertModal === 'function') {
                  (window as any).openAlertModal();
                } else {
                  // Otherwise navigate to reports
                  navigate('/reports');
                }
                handleClose();
              }}
              sx={{
                backgroundColor: "warning.light",
                whiteSpace: "normal",
                py: 1.5,
              }}
            >
              <Box display="flex" gap={1} width="100%">
                <IconAlertTriangle size={20} color="orange" style={{ marginTop: 4, flexShrink: 0 }} />
                <Box flex={1}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{alertCount} SIM Usage Alert{alertCount !== 1 ? 's' : ''}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to view details
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          )}
          
          {loading && (
            <MenuItem>
              <Box display="flex" justifyContent="center" width="100%" py={2}>
                <CircularProgress size={24} />
              </Box>
            </MenuItem>
          )}

          {!loading && notifications.length === 0 && alertCount === 0 && (
            <MenuItem>
              <ListItemText sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </ListItemText>
            </MenuItem>
          )}

          {!loading &&
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: notification.read ? "transparent" : "action.hover",
                  whiteSpace: "normal",
                  py: 1.5,
                }}
              >
                <Box display="flex" gap={1} width="100%">
                  <IconUser size={20} style={{ marginTop: 4, flexShrink: 0 }} />
                  <Box flex={1}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{notification.user_username}</strong> registered
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {notification.user_email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {formatTimeAgo(notification.created_at)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
        </MenuList>
      </Menu>
    </>
  );
};
