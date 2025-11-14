module.exports = {
  apps: [{
    name: 'omar-smc-frontend',
    script: 'node_modules/.bin/react-scripts',
    args: 'start',
    cwd: '/root/Omar-s-SMC/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    }
  }]
};
