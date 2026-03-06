const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const serverVersion = require("../../package.json").version || "1.0.0";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mobitech SIM Dashboard API",
      version: serverVersion,
      description:
        "REST API for the Mobitech SIM Card Data Usage Dashboard. Manages SIM cards, usage monitoring, alerts, user authentication, and system settings.",
      contact: {
        name: "Mobitech Support",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from POST /auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "user"] },
            status: {
              type: "string",
              enum: [
                "pending_verification",
                "pending_approval",
                "active",
                "rejected",
              ],
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            totalSims: { type: "integer" },
            monthlyUsage: { type: "string" },
            monthlyUsageUnit: { type: "string", example: "GB" },
            projectedUsage: { type: "string" },
            projectedUsageUnit: { type: "string", example: "GB" },
            projectionData: {
              type: "object",
              properties: {
                daysElapsed: { type: "integer" },
                daysInMonth: { type: "integer" },
                dailyAverage: { type: "string" },
              },
            },
            poolUtilization: {
              type: "object",
              properties: {
                totalCapacity: { type: "string" },
                totalUsed: { type: "string" },
                unit: { type: "string", example: "GB" },
                percentage: { type: "number" },
              },
            },
            alerts: { type: "integer" },
            alertThreshold: { type: "number" },
          },
        },
        SimCard: {
          type: "object",
          properties: {
            assetId: { type: "integer" },
            iccid: { type: "string" },
            msisdn: { type: "string" },
            dataSize: { type: "string", description: "Capacity in MB" },
            dataUsed: { type: "string", description: "Usage in MB" },
            usagePercent: { type: "string" },
            lastConnection: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdTime: { type: "string", format: "date-time" },
          },
        },
        UserPreferences: {
          type: "object",
          properties: {
            user_email: { type: "string" },
            alerts_enabled: { type: "boolean" },
            warning_threshold: { type: "number" },
            critical_threshold: { type: "number" },
            projected_threshold: { type: "number" },
            email_alerts_enabled: { type: "boolean" },
            email_alert_time: { type: "string", example: "09:00" },
            warning_color: { type: "string", example: "#ed6c02" },
            critical_color: { type: "string", example: "#d32f2f" },
          },
        },
        SystemSetting: {
          type: "object",
          properties: {
            value: { type: "string" },
            description: { type: "string", nullable: true },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "integer" },
            admin_id: { type: "integer" },
            user_id: { type: "integer" },
            type: { type: "string" },
            message: { type: "string" },
            read: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Server health and readiness checks" },
      { name: "Auth", description: "Authentication and registration" },
      { name: "Users", description: "User management (admin only)" },
      { name: "Dashboard", description: "Dashboard statistics and analytics" },
      { name: "SIM Cards", description: "SIM card management and history" },
      { name: "Reports", description: "Custom reports and alerts" },
      { name: "Notifications", description: "Admin notification management" },
      { name: "Profile", description: "User profile and avatar management" },
      { name: "Preferences", description: "User alert preferences" },
      {
        name: "Settings",
        description: "System settings (admin only for writes)",
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "./swaggerDocs.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
