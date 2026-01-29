import apiClient from './api';

export interface DashboardStats {
  totalSims: number;
  monthlyUsage: string;
  poolUtilization: {
    totalCapacity: string;
    totalUsed: string;
    percentage: number;
  };
  alerts: number;
  alertThreshold: number;
}

export interface TopConsumer {
  iccid: string;
  msisdn: string;
  totalUsed: string;
  dataSize: string;
  usagePercent: string;
  lastConnection: string | null;
}

export interface SimCard {
  assetId: number;
  iccid: string;
  msisdn: string;
  dataSize: string;
  dataUsed: string;
  usagePercent: string;
  lastConnection: string | null;
  createdTime: string;
}

export interface SimHistory {
  time: string;
  dataUsed: string;
  dataSize: string;
  lastConnection: string | null;
}

export const dashboardService = {
  async getStats(threshold: number = 0.8): Promise<DashboardStats> {
    const response = await apiClient.get(`/dashboard/stats?threshold=${threshold}`);
    return response.data.data;
  },

  async getTopConsumers(limit: number = 10, period: string = 'month'): Promise<TopConsumer[]> {
    const response = await apiClient.get(`/dashboard/top-consumers?limit=${limit}&period=${period}`);
    return response.data.data;
  },
};

export const simService = {
  async getAll(page: number = 1, limit: number = 20, search: string = '') {
    const response = await apiClient.get(`/sims?page=${page}&limit=${limit}&search=${search}`);
    return response.data.data;
  },

  async getHistory(iccid: string, period: string = 'week', groupBy: string = 'hour') {
    const response = await apiClient.get(`/sims/${iccid}/history?period=${period}&groupBy=${groupBy}`);
    return response.data.data;
  },
};

export const reportService = {
  async generateCustomReport(filters: any) {
    const response = await apiClient.post('/reports/custom', filters);
    return response.data.data;
  },

  async generateDynamicReport(params: any) {
    const response = await apiClient.post('/reports/dynamic', params);
    return response.data.data;
  },

  async getAlerts(threshold: number = 0.8) {
    const response = await apiClient.get(`/reports/alerts?threshold=${threshold}`);
    return response.data.data;
  },

  async getMonthlyUsage(months: number = 12) {
    const response = await apiClient.get(`/reports/monthly-usage?months=${months}`);
    return response.data.data;
  },

  async getMetadata() {
    const response = await apiClient.get('/reports/metadata');
    return response.data.data;
  },
};
