import { reportService } from './simcard';
import { preferencesService, DEFAULT_PREFERENCES } from './preferences';

export interface NotificationAlert {
  count: number;
  warningCount: number;
  criticalCount: number;
  lastUpdated: Date;
}

export const notificationService = {
  /**
   * Get alert summary for notification icon
   */
  async getAlertSummary(): Promise<NotificationAlert> {
    try {
      // Get user preferences to know thresholds
      const preferences = await preferencesService.getPreferences().catch(() => DEFAULT_PREFERENCES);
      
      if (!preferences || !preferences.alerts_enabled) {
        return {
          count: 0,
          warningCount: 0,
          criticalCount: 0,
          lastUpdated: new Date(),
        };
      }

      const warningThreshold = preferences.warning_threshold / 100;
      const criticalThreshold = preferences.critical_threshold / 100;

      // Fetch alerts for both current usage thresholds and projected alerts
      const [warningData, criticalData, projectedData] = await Promise.all([
        reportService.getAlerts(warningThreshold),
        reportService.getAlerts(criticalThreshold),
        reportService.getProjectedAlerts(preferences.projected_threshold / 100),
      ]);

      // Critical alerts are those >= critical threshold
      const criticalCount = criticalData.count;
      
      // Warning alerts are those >= warning threshold but < critical threshold
      const totalWarningAndAbove = warningData.count;
      const warningCount = totalWarningAndAbove - criticalCount;
      
      // Add projected alerts to the total count
      const projectedCount = projectedData.count || 0;
      const totalCount = totalWarningAndAbove + projectedCount;

      return {
        count: totalCount,
        warningCount: Math.max(0, warningCount),
        criticalCount,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch alert summary:', error);
      return {
        count: 0,
        warningCount: 0,
        criticalCount: 0,
        lastUpdated: new Date(),
      };
    }
  },

  /**
   * Format last updated time as relative string
   */
  formatLastUpdated(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  },
};
