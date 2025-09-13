require('dotenv').config();
const { app, initializeServices } = require('./app');
const config = require('./utils/config');

const PORT = config.port;

async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();