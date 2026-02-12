import {
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  TextField,
  Typography,
  Stack,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Form,
  LoaderFunctionArgs,
  redirect,
  useActionData,
  useLocation,
  useNavigation,
  Link as RouterLink,
} from "react-router-dom";
import { authProvider } from "../../services/auth";

interface LoginActionData {
  error?: string;
  status?: string;
}

export function LoginPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const from = params.get("from") || "/";

  const navigation = useNavigation();
  const isLoggingIn = navigation.formData?.get("username") != null;

  const actionData = useActionData() as LoginActionData | undefined;

  // Determine alert severity and message based on status
  const getAlertInfo = () => {
    if (!actionData?.error) return null;

    switch (actionData.status) {
      case "pending_verification":
        return {
          severity: "warning" as const,
          title: "Email Verification Required",
          message: actionData.error,
        };
      case "pending_approval":
        return {
          severity: "info" as const,
          title: "Pending Admin Approval",
          message: actionData.error,
        };
      case "rejected":
        return {
          severity: "error" as const,
          title: "Account Rejected",
          message: actionData.error,
        };
      default:
        return {
          severity: "error" as const,
          title: "Login Failed",
          message: actionData.error,
        };
    }
  };

  const alertInfo = getAlertInfo();

  return (
    <Form method="post" replace>
      <input type="hidden" name="redirectTo" value={from} />
      <Typography variant="h5" gutterBottom>
        Sign in to your account
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Enter your credentials to access SIM Dashboard
      </Typography>

      <TextField
        margin="normal"
        fullWidth
        id="email"
        label="Username or Email"
        name="email"
        autoComplete="email"
        autoFocus
      />
      <TextField
        margin="normal"
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
      />
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
        <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label="Remember me"
        />
        <Link component={RouterLink} to="/auth/forgot-password" variant="body2" underline="hover">
          Forgot password?
        </Link>
      </Stack>

      {alertInfo && (
        <Alert severity={alertInfo.severity} sx={{ mt: 2 }}>
          <AlertTitle>{alertInfo.title}</AlertTitle>
          {alertInfo.message}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? "Logging in..." : "Sign In"}
      </Button>

      <Stack direction="row" justifyContent="center" spacing={1}>
        <Typography variant="body2">
          Don't have an account?
        </Typography>
        <Link component={RouterLink} to="/auth/register" variant="body2" underline="hover">
          Sign Up
        </Link>
      </Stack>
    </Form>
  );
}

export async function loginAction({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  // Validate our form inputs and return validation errors via useActionData()
  if (!username) {
    return {
      error: "You must provide a username or email to log in",
    };
  }

  if (!password) {
    return {
      error: "You must provide a password to log in",
    };
  }

  // Sign in and redirect to the proper destination if successful.
  try {
    const result = await authProvider.signin(username, password);
    
    if (!result.success) {
      return {
        error: result.error || "Invalid login attempt",
        status: result.status,
      };
    }

    const redirectTo = formData.get("redirectTo") as string | null;
    return redirect(redirectTo || "/");
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function loginLoader() {
  // Check if user is already authenticated
  if (authProvider.checkAuth()) {
    return redirect("/");
  }
  return null;
}
