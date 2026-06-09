const redis = require('../config/redis');

function CacheService(redisClient) {
  const client = redisClient || redis;

  async function get(key) {
    try {
      const value = await client.get(key);
      if (!value) return null;
      try { return JSON.parse(value); } catch { return value; }
    } catch {
      return null;
    }
  }

  async function set(key, value, ttl = 60) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await client.set(key, serialized, 'EX', ttl);
    } catch {}
  }

  async function del(key) {
    try {
      await client.del(key);
    } catch {}
  }

  async function clearNamespace(pattern) {
    try {
      let cursor = '0';
      do {
        const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) await client.del(...keys);
      } while (cursor !== '0');
    } catch {}
  }

  return { get, set, del, clearNamespace };
}

module.exports = { CacheService };
