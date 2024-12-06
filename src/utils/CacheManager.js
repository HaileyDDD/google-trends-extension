export class CacheManager {
  constructor(storage) {
    this.storage = storage;
    this.memoryCache = new Map();
    this.config = {
      maxAge: {
        'now 1-H': 5 * 60 * 1000,    // 5分钟
        'now 4-H': 15 * 60 * 1000,   // 15分钟
        'now 1-d': 60 * 60 * 1000,   // 1小时
        'now 7-d': 3 * 60 * 60 * 1000 // 3小时
      },
      maxItems: 1000,
      compressionThreshold: 1024 // 字节
    };
  }

  async get(key) {
    // 先检查内存缓存
    if (this.memoryCache.has(key)) {
      const item = this.memoryCache.get(key);
      if (!this._isExpired(item)) {
        return item.value;
      }
      this.memoryCache.delete(key);
    }

    // 检查持久化缓存
    try {
      const data = await this.storage.get(key);
      if (data && !this._isExpired(data)) {
        // 更新内存缓存
        this.memoryCache.set(key, data);
        return data.value;
      }
    } catch (error) {
      console.error('缓存读取错误:', error);
    }

    return null;
  }

  async set(key, value, options = {}) {
    const item = {
      value,
      timestamp: Date.now(),
      maxAge: options.maxAge || this._getDefaultMaxAge(options.timeRange),
      compressed: false
    };

    // 大数据压缩
    if (this._shouldCompress(value)) {
      item.value = await this._compress(value);
      item.compressed = true;
    }

    // 更新内存缓存
    this.memoryCache.set(key, item);

    // 更新持久化缓存
    try {
      await this.storage.set(key, item);
      await this.cleanup();
    } catch (error) {
      console.error('缓存写入错误:', error);
    }
  }

  // 使用下划线前缀表示私有方法
  _isExpired(item) {
    return Date.now() - item.timestamp > item.maxAge;
  }

  _getDefaultMaxAge(timeRange) {
    return this.config.maxAge[timeRange] || this.config.maxAge['now 1-H'];
  }

  _shouldCompress(value) {
    return JSON.stringify(value).length > this.config.compressionThreshold;
  }

  async _compress(value) {
    // 实现数据压缩
    return value;
  }

  async cleanup() {
    // 清理过期和超量的缓存
    const keys = await this.storage.getAllKeys();
    if (keys.length > this.config.maxItems) {
      // 删除最旧的缓存
      const itemsToRemove = keys.length - this.config.maxItems;
      const oldestKeys = await this._getOldestKeys(itemsToRemove);
      await Promise.all(oldestKeys.map(key => this.storage.remove(key)));
    }
  }

  async _getOldestKeys(count) {
    const items = await this.storage.get(null);
    return Object.entries(items)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count)
      .map(([key]) => key);
  }
} 