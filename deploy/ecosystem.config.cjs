module.exports = {
  apps: [{
    name: "auroxday-admin",
    cwd: "/var/www/compcri-admin-dashboard",
    script: ".next/standalone/server.js",
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "600M",
    env: { NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3002" },
    time: true,
    merge_logs: true
  }]
};
