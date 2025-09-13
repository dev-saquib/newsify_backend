const { v4: uuidv4 } = require('uuid');

class SessionService {
  constructor(redisClient, sessionTtl) {
    this.redisClient = redisClient;
    this.sessionTtl = sessionTtl;
  }
  
  async createSession() {
    const sessionId = uuidv4();
    const key = `session:${sessionId}:history`;
    
    await this.redisClient.lPush(key, JSON.stringify({
      type: 'system',
      content: 'Session initialized',
      timestamp: new Date().toISOString()
    }));
    
    await this.redisClient.expire(key, this.sessionTtl);
    return { sessionId };
  }
  
  async getSessionHistory(sessionId) {
    const key = `session:${sessionId}:history`;
    const history = await this.redisClient.lRange(key, 0, -1);
    return history.map(item => JSON.parse(item));
  }
  
  async addMessageToHistory(sessionId, message) {
    const key = `session:${sessionId}:history`;
    await this.redisClient.rPush(key, JSON.stringify(message));
    await this.redisClient.expire(key, this.sessionTtl);
  }
  
  async clearSession(sessionId) {
    const key = `session:${sessionId}:history`;
    await this.redisClient.del(key);
  }
}

module.exports = SessionService;