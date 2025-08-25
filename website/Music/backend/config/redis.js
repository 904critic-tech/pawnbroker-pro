const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
});

client.on('connect', () => {
    console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

client.on('ready', () => {
    console.log('✅ Redis client ready');
});

// Connect to Redis
client.connect().catch(console.error);

module.exports = client;
