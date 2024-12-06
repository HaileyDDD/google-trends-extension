// 自定义错误类型
class TrendsError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'TrendsError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
  }
}

// 错误处理工具
const ErrorHandler = {
  // 错误代码
  codes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    API_ERROR: 'API_ERROR',
    CACHE_ERROR: 'CACHE_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
  },

  // 处理错误
  handle(error, context = '') {
    console.error(`[${context}] Error:`, error);

    // 记录错误
    this.logError(error);

    // 返回用户友好的错误消息
    return this.getUserFriendlyMessage(error);
  },

  // 记录错误
  logError(error) {
    const errorLog = {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp || new Date(),
      stack: error.stack
    };

    // 存储错误日志
    chrome.storage.local.get(['errorLogs'], (data) => {
      const logs = data.errorLogs || [];
      logs.push(errorLog);
      // 只保留最近100条错误记录
      if (logs.length > 100) logs.shift();
      chrome.storage.local.set({ errorLogs: logs });
    });
  },

  // 获取用户友好的错误消息
  getUserFriendlyMessage(error) {
    const messages = {
      [this.codes.NETWORK_ERROR]: '网络连接错误，请检查您的网络连接',
      [this.codes.API_ERROR]: '服务暂时不可用，请稍后重试',
      [this.codes.CACHE_ERROR]: '数据缓存错误',
      [this.codes.VALIDATION_ERROR]: '数据格式错误',
      [this.codes.RATE_LIMIT_ERROR]: '请求过于频繁，请稍后再试'
    };

    return messages[error.code] || '发生未知错误，请稍后重试';
  },

  // 创建错误
  createError(code, message, details = {}) {
    return new TrendsError(message, code, details);
  }
};

export { ErrorHandler, TrendsError }; 