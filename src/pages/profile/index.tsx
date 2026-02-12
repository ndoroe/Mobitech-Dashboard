import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Avatar,
  Alert,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { PageLayout } from "../../components";
import api from "../../services/api";
import { authProvider } from "../../services/auth";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/profile");
      setProfile(response.data.user);
      if (response.data.user.avatar) {
        setAvatarPreview(`http://192.168.101.15:5000${response.data.user.avatar}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.post("/profile/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMessage(response.data.message);
      setAvatarPreview(`http://192.168.101.15:5000${response.data.avatar}`);
      
      // Update auth provider with new avatar
      if (authProvider.user) {
        authProvider.user.avatar = response.data.avatar;
        localStorage.setItem("user", JSON.stringify(authProvider.user));
      }
      
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your avatar?")) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.delete("/profile/avatar");
      setSuccessMessage(response.data.message);
      setAvatarPreview(null);
      
      // Update auth provider
      if (authProvider.user) {
        authProvider.user.avatar = undefined;
        localStorage.setItem("user", JSON.stringify(authProvider.user));
      }
      
      fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete avatar");
    }
  };

  if (loading) {
    return (
      <PageLayout title="Profile">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout title="Profile">
        <Alert severity="error">Failed to load profile</Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Profile">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Success/Error Messages */}
        {successMessage && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          </Grid>
        )}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                src={avatarPreview || undefined}
                alt={profile.username}
                sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 }, mb: 2 }}
              />
              
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <label htmlFor="avatar-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={uploadingAvatar ? <CircularProgress size={16} /> : <IconUpload size={16} />}
                  disabled={uploadingAvatar}
                  sx={{ mb: 1, width: { xs: '100%', sm: 'auto' } }}
                  size="small"
                >
                  {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                </Button>
              </label>
              
              {avatarPreview && (
                <Button
                  variant="text"
                  color="error"
                  startIcon={<IconTrash size={16} />}
                  onClick={handleAvatarDelete}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Remove Avatar
                </Button>
              )}
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Username
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.username}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.email}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Role
              </Typography>
              <Typography variant="body1" gutterBottom>
                {profile.role.toUpperCase()}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Member Since
              </Typography>
              <Typography variant="body1">
                {new Date(profile.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box component="form" onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="Minimum 8 characters"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={changingPassword}
                startIcon={changingPassword ? <CircularProgress size={16} /> : undefined}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                {changingPassword ? "Changing Password..." : "Change Password"}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </PageLayout>
  );
}
