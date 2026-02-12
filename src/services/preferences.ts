import apiClient from './api';

export interface UserPreferences {
  user_email: string;
  alerts_enabled: boolean;
  warning_threshold: number;
  critical_threshold: number;
  warning_color: string;
  critical_color: string;
  created_at?: string;
  updated_at?: string;
}

export interface PreferencesUpdateRequest {
  alerts_enabled?: boolean;
  warning_threshold?: number;
  critical_threshold?: number;
  warning_color?: string;
  critical_color?: string;
}

export const preferencesService = {
  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: UserPreferences;
      }>('/preferences');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch preferences, using defaults:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: PreferencesUpdateRequest
  ): Promise<UserPreferences> {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: UserPreferences;
    }>('/preferences', preferences);
    return response.data.data;
  },

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<UserPreferences> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: UserPreferences;
    }>('/preferences/reset');
    return response.data.data;
  },
};

// Default preferences to use as fallback
export const DEFAULT_PREFERENCES: UserPreferences = {
  user_email: '',
  alerts_enabled: true,
  warning_threshold: 60,
  critical_threshold: 80,
  warning_color: '#ed6c02',
  critical_color: '#d32f2f',
};
