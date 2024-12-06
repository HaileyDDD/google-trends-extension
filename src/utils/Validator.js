const Validator = {
  validateTrend(trend) {
    const errors = [];

    // 检查必需字段
    if (!trend.title?.query) {
      errors.push('Missing required field: keyword');
    }

    // 验证流量格式
    if (trend.formattedTraffic && !this.isValidTrafficFormat(trend.formattedTraffic)) {
      errors.push('Invalid traffic format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  isValidTrafficFormat(traffic) {
    // 支持更多格式
    return /^[\d,.]+[KMB]?\+?$/.test(traffic) || 
           /^[\d,.]+(千|万|亿)?\+?$/.test(traffic) ||
           /^\d+[KM]$/.test(traffic);
  }
};

export { Validator }; 