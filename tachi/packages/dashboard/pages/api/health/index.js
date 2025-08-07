export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'checking',
      blockchain: 'checking',
      redis: 'checking'
    }
  };
  
  res.status(200).json(health);
}
