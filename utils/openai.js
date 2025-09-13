const OpenAI = require('openai');
const config = require('../utils/config');

const openai = new OpenAI({
    apiKey: config.openai.apiKey,
    baseURL: config.openai.baseUrl
});

module.exports = openai;