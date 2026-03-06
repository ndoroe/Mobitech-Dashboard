const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const target = "http://localhost:5000";

  console.log("🔧 Proxying /api requests to:", target);

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: "debug",
    }),
  );

  // Proxy health/ready endpoints to backend
  app.use(
    ["/health", "/ready"],
    createProxyMiddleware({
      target,
      changeOrigin: true,
    }),
  );
};
