import {
  Button,
  TextField,
  Typography,
  Link,
  Alert,
} from "@mui/material";
import {
  Form,
  LoaderFunctionArgs,
  useActionData,
  useNavigation,
  Link as RouterLink,
} from "react-router-dom";
import { useState } from "react";

interface RegisterActionData {
  error?: string;
  success?: boolean;
  message?: string;
  email?: string;
}

export function RegisterPage() {
  const navigation = useNavigation();
  const isSubmitting = navigation.formData?.get("username") != null;
  const actionData = useActionData() as RegisterActionData | undefined;

  return (
    <>
      {actionData?.success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Registration successful!</strong>
          </Typography>
          <Typography variant="body2">
            Please check your email ({actionData.email}) to verify your account.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/auth/login">
              Return to login
            </Link>
          </Typography>
        </Alert>
      ) : (
        <Form method="post" replace>
          <Typography variant="h5" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Register for SIM Dashboard access
          </Typography>

          <TextField
            margin="normal"
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            required
            helperText="3-50 characters, letters, numbers, hyphens, and underscores only"
          />

          <TextField
            margin="normal"
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            required
          />

          <TextField
            margin="normal"
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            required
            helperText="Minimum 8 characters"
          />

          <TextField
            margin="normal"
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Link component={RouterLink} to="/auth/login" underline="hover">
              Sign in
            </Link>
          </Typography>

          {actionData?.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionData.error}
            </Alert>
          )}

          {actionData?.message && !actionData.success && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {actionData.message}
            </Alert>
          )}
        </Form>
      )}
    </>
  );
}

export async function registerAction({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string | null;
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;

  // Client-side validation
  if (!username || !email || !password || !confirmPassword) {
    return {
      error: "All fields are required",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  if (password.length < 8) {
    return {
      error: "Password must be at least 8 characters long",
    };
  }

  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || "Registration failed",
      };
    }

    // Check if this was the first user (auto-admin)
    if (data.isFirstUser && data.token) {
      // Store token and redirect to dashboard
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/";
      return null;
    }

    return {
      success: true,
      message: data.message,
      email: email,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      error: "Network error. Please try again.",
    };
  }
}
