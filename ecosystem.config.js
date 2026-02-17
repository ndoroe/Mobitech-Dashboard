module.exports = {
  apps: [
    {
      name: 'mobitech-sim-dashboard',
      script: 'server/src/server.js',
      cwd: '/root/mobitech/sim-dashboard',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '500M',

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 8000,
    },
  ],
};
