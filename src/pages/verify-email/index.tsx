import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

type VerificationStatus = "verifying" | "success" | "error" | "expired";

interface VerificationResult {
  status: VerificationStatus;
  message: string;
  canResend?: boolean;
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [result, setResult] = useState<VerificationResult>({
    status: "verifying",
    message: "Verifying your email...",
  });
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setResult({
        status: "error",
        message: "Invalid verification link. No token provided.",
      });
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-email/${verificationToken}`
      );

      const data = await response.json();

      if (response.ok) {
        setResult({
          status: "success",
          message: data.message || "Email verified successfully!",
        });
      } else {
        setResult({
          status: data.expired ? "expired" : "error",
          message: data.message || "Verification failed",
          canResend: data.expired,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setResult({
        status: "error",
        message: "Network error. Please try again later.",
      });
    }
  };

  const handleResendVerification = async () => {
    // We don't have the email here, so we'll need to implement a form
    // For now, just show a message
    setResending(true);
    // This would need to be enhanced to collect email
    setTimeout(() => {
      setResending(false);
      alert("Please contact support to resend verification email.");
    }, 1000);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          {result.status === "verifying" && (
            <>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h5" gutterBottom>
                Verifying Email
              </Typography>
              <Typography color="text.secondary">
                Please wait while we verify your email address...
              </Typography>
            </>
          )}

          {result.status === "success" && (
            <>
              <CheckCircleOutlineIcon
                sx={{ fontSize: 80, color: "success.main", mb: 2 }}
              />
              <Typography variant="h5" gutterBottom color="success.main">
                Email Verified!
              </Typography>
              <Alert severity="success" sx={{ mt: 2, mb: 3, textAlign: "left" }}>
                {result.message}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your account is now pending admin approval. You will receive an
                email notification once your account is approved.
              </Typography>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
                size="large"
              >
                Go to Login
              </Button>
            </>
          )}

          {result.status === "expired" && (
            <>
              <ErrorOutlineIcon
                sx={{ fontSize: 80, color: "warning.main", mb: 2 }}
              />
              <Typography variant="h5" gutterBottom color="warning.main">
                Link Expired
              </Typography>
              <Alert severity="warning" sx={{ mt: 2, mb: 3, textAlign: "left" }}>
                {result.message}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your verification link has expired. Please request a new one.
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  component={RouterLink}
                  to="/auth/login"
                  variant="outlined"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={handleResendVerification}
                  variant="contained"
                  disabled={resending}
                >
                  {resending ? "Sending..." : "Resend Email"}
                </Button>
              </Box>
            </>
          )}

          {result.status === "error" && (
            <>
              <ErrorOutlineIcon
                sx={{ fontSize: 80, color: "error.main", mb: 2 }}
              />
              <Typography variant="h5" gutterBottom color="error.main">
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mt: 2, mb: 3, textAlign: "left" }}>
                {result.message}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The verification link is invalid or has already been used.
              </Typography>
              <Button
                component={RouterLink}
                to="/auth/login"
                variant="contained"
              >
                Back to Login
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
