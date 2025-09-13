async function healthCheck(req, res) {
  try {
    const redisClient = req.app.get('redisClient');
    const pool = req.app.get('pool');
    
    const [redisPing, postgresPing] = await Promise.all([
      redisClient.ping(),
      pool.query('SELECT 1')
    ]);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
        postgres: postgresPing ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}

module.exports = { healthCheck };