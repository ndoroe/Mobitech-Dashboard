const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export type TUser = {
  id?: number;
  avatar?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
};

interface AuthProvider {
  isAuthenticated: boolean;
  user: null | TUser;
  signin(username: string, password: string | null): Promise<{ success: boolean; error?: string; status?: string }>;
  signout(): Promise<void>;
  getCurrentUser(): Promise<TUser | null>;
  checkAuth(): boolean;
}

/**
 * Authentication provider with real backend API integration
 */
export const authProvider: AuthProvider = {
  isAuthenticated: false,
  user: null,

  /**
   * Sign in user with username/email and password
   */
  async signin(username: string, password: string | null) {
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Login failed",
          status: data.status,
        };
      }

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      authProvider.isAuthenticated = true;
      authProvider.user = data.user;

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  },

  /**
   * Sign out user and clear authentication state
   */
  async signout() {
    try {
      const token = localStorage.getItem("token");
      
      if (token) {
        // Call backend logout endpoint
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of backend call success
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      authProvider.isAuthenticated = false;
      authProvider.user = null;
    }
  },

  /**
   * Get current authenticated user from backend
   */
  async getCurrentUser(): Promise<TUser | null> {
    const token = localStorage.getItem("token");

    if (!token) {
      authProvider.isAuthenticated = false;
      authProvider.user = null;
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token is invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        authProvider.isAuthenticated = false;
        authProvider.user = null;
        return null;
      }

      const data = await response.json();
      authProvider.isAuthenticated = true;
      authProvider.user = data.user;
      
      // Update local storage with fresh user data
      localStorage.setItem("user", JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      console.error("Get current user error:", error);
      authProvider.isAuthenticated = false;
      authProvider.user = null;
      return null;
    }
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  checkAuth(): boolean {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        authProvider.isAuthenticated = true;
        authProvider.user = user;
        return true;
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    authProvider.isAuthenticated = false;
    authProvider.user = null;
    return false;
  },
};
