import apiClient from "./api";

export interface SystemSetting {
  value: string;
  description: string | null;
  updated_at: string;
}

export interface SystemSettingsMap {
  [key: string]: SystemSetting;
}

export const settingsService = {
  /**
   * Get all system settings
   */
  async getSystemSettings(): Promise<SystemSettingsMap> {
    const response = await apiClient.get<{
      success: boolean;
      data: SystemSettingsMap;
    }>("/settings");
    return response.data.data;
  },

  /**
   * Update a system setting (admin only)
   */
  async updateSystemSetting(
    key: string,
    value: string,
  ): Promise<{ key: string; value: string }> {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: {
        key: string;
        value: string;
        description: string;
        updated_at: string;
      };
    }>(`/settings/${key}`, { value });
    return response.data.data;
  },
};
