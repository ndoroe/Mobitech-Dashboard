import {
  createBrowserRouter,
  LoaderFunctionArgs,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { AppLayout, AuthLayout } from "./components";
import ErrorPage from "./pages/error";
import HomePage from "./pages/home";
import { loginAction, loginLoader, LoginPage } from "./pages/login";
import { RegisterPage, registerAction } from "./pages/register";
import { VerifyEmailPage } from "./pages/verify-email";
import ForgotPasswordPage from "./pages/forgot-password";
import ResetPasswordPage from "./pages/reset-password";
import UsersManagementPage from "./pages/admin/users";
import ProfilePage from "./pages/profile";
import { authProvider } from "./services/auth";
import SimCardsPage from "./pages/simcards";
import ReportsPage from "./pages/reports";
import SettingsPage from "./pages/settings";
import { InstallPrompt } from "./components/InstallPrompt";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { Snackbar, Alert } from "@mui/material";
import { useState, useEffect } from "react";

// The basename of the app for situations where you can't deploy to the root of the domain, but a sub directory.
export const BASE_NAME =
  window.location.hostname === "ducthanhnguyen.github.io"
    ? "/MaterialAdminLTE"
    : undefined;

const router = createBrowserRouter(
  [
    {
      id: "root",
      path: "/",
      loader() {
        // Our root route always provides the user, if logged in
        return {
          user: authProvider.user,
          isAuthenticated: authProvider.isAuthenticated,
        };
      },
      Component: AppLayout,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          loader: protectedLoader,
          Component: HomePage,
        },
        {
          path: "simcards",
          loader: protectedLoader,
          Component: SimCardsPage,
        },
        {
          path: "reports",
          loader: protectedLoader,
          Component: ReportsPage,
        },
        {
          path: "settings",
          loader: protectedLoader,
          Component: SettingsPage,
        },
        {
          path: "profile",
          loader: protectedLoader,
          Component: ProfilePage,
        },
        {
          path: "admin/users",
          loader: adminLoader,
          Component: UsersManagementPage,
        },
      ],
    },
    {
      id: "auth",
      path: "/auth/",
      Component: AuthLayout,
      children: [
        {
          path: "login",
          action: loginAction,
          loader: loginLoader,
          Component: LoginPage,
        },
        {
          path: "register",
          action: registerAction,
          Component: RegisterPage,
        },
        {
          path: "verify-email",
          Component: VerifyEmailPage,
        },
        {
          path: "forgot-password",
          Component: ForgotPasswordPage,
        },
        {
          path: "reset-password/:token",
          Component: ResetPasswordPage,
        },
      ],
    },
    {
      path: "logout",
      async action() {
        // We signout in a "resource route" that we can hit from a fetcher.Form
        await authProvider.signout();
        return redirect("/");
      },
    },
  ],
  {
    basename: BASE_NAME,
  },
);

function protectedLoader({ request }: LoaderFunctionArgs) {
  // If the user is not logged in and tries to access `/protected`, we redirect
  // them to `/auth/login` with a `from` parameter that allows login to redirect back
  // to this page upon successful authentication
  
  // Check authentication status from localStorage
  const isAuth = authProvider.checkAuth();
  
  if (!isAuth) {
    let from = new URL(request.url).pathname;
    if (BASE_NAME && from.startsWith(BASE_NAME)) {
      from = BASE_NAME.substring(BASE_NAME.length);
    }
    if (from && from !== "/") {
      const params = new URLSearchParams();
      params.set("from", from);
      return redirect("/auth/login?" + params.toString());
    }

    return redirect("/auth/login");
  }
  return null;
}

function adminLoader({ request }: LoaderFunctionArgs) {
  // Check authentication first
  const protectedResult = protectedLoader({ request } as LoaderFunctionArgs);
  if (protectedResult) return protectedResult;

  // Check if user has admin role
  if (authProvider.user?.role !== "admin") {
    // Redirect non-admin users to home page
    return redirect("/");
  }

  return null;
}

function App() {
  const isOnline = useOnlineStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    } else {
      setShowOfflineAlert(false);
      // Show online alert only if we were previously offline
      if (showOfflineAlert) {
        setShowOnlineAlert(true);
        setTimeout(() => setShowOnlineAlert(false), 3000);
      }
    }
  }, [isOnline, showOfflineAlert]);

  return (
    <>
      <RouterProvider router={router} fallbackElement={<p>Initial Load...</p>} />
      <InstallPrompt />
      
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" variant="filled">
          You are offline. Some features may not be available.
        </Alert>
      </Snackbar>

      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Connection restored!
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
