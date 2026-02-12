import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tabs,
  Tab,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import { PageLayout } from "../../../components";
import api from "../../../services/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  status: "pending_verification" | "pending_approval" | "active" | "rejected";
  created_at: string;
}

interface RejectDialogState {
  open: boolean;
  userId: number | null;
  username: string;
}

export default function UsersManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>({
    open: false,
    userId: null,
    username: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number, username: string) => {
    try {
      await api.post(`/users/${userId}/approve`);
      setSuccessMessage(`User ${username} has been approved successfully!`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleRejectClick = (userId: number, username: string) => {
    setRejectDialog({
      open: true,
      userId,
      username,
    });
    setRejectReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectDialog.userId) return;

    try {
      await api.post(`/users/${rejectDialog.userId}/reject`, {
        reason: rejectReason || undefined,
      });
      setSuccessMessage(
        `User ${rejectDialog.username} has been rejected.`
      );
      setRejectDialog({ open: false, userId: null, username: "" });
      setRejectReason("");
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject user");
      setRejectDialog({ open: false, userId: null, username: "" });
    }
  };

  const handleRoleChange = async (userId: number, newRole: "admin" | "user") => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setSuccessMessage(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user role");
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setSuccessMessage(`User ${username} has been deleted.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const getStatusChip = (status: User["status"]) => {
    const statusConfig = {
      pending_verification: { label: "Pending Verification", color: "warning" as const },
      pending_approval: { label: "Pending Approval", color: "info" as const },
      active: { label: "Active", color: "success" as const },
      rejected: { label: "Rejected", color: "error" as const },
    };

    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getRoleChip = (role: User["role"]) => {
    return (
      <Chip
        label={role.toUpperCase()}
        color={role === "admin" ? "secondary" : "default"}
        size="small"
      />
    );
  };

  const filterUsers = (status?: User["status"]) => {
    if (status) {
      return users.filter((user) => user.status === status);
    }
    return users;
  };

  const renderUserTable = (filteredUsers: User[], showActions = true) => (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Username</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Role</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Created</TableCell>
            {showActions && <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} align="center">
                <Typography color="text.secondary">No users found</Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {user.username}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  {user.status === "active" ? (
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as "admin" | "user")
                        }
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    getRoleChip(user.role)
                  )}
                </TableCell>
                <TableCell>{getStatusChip(user.status)}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                {showActions && (
                  <TableCell align="right">
                    {user.status === "pending_approval" && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(user.id, user.username)}
                          title="Approve"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleRejectClick(user.id, user.username)
                          }
                          title="Reject"
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                    {user.status !== "pending_approval" && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(user.id, user.username)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <PageLayout title="User Management">
      <Box sx={{ width: "100%" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        <Paper sx={{ mb: 2, overflowX: 'auto' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                minHeight: { xs: 48, sm: 64 },
              }
            }}
          >
            <Tab label="All Users" />
            <Tab
              label={`Pending Approval (${
                filterUsers("pending_approval").length
              })`}
            />
            <Tab label="Active Users" />
            <Tab label="Rejected" />
          </Tabs>
        </Paper>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <>
            {tabValue === 0 && renderUserTable(users)}
            {tabValue === 1 &&
              renderUserTable(filterUsers("pending_approval"))}
            {tabValue === 2 && renderUserTable(filterUsers("active"))}
            {tabValue === 3 && renderUserTable(filterUsers("rejected"))}
          </>
        )}

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onClose={() =>
            setRejectDialog({ open: false, userId: null, username: "" })
          }
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Reject User Registration</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to reject the registration for{" "}
              <strong>{rejectDialog.username}</strong>?
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason (Optional)"
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setRejectDialog({ open: false, userId: null, username: "" })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleRejectConfirm} color="error" variant="contained">
              Reject User
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PageLayout>
  );
}
