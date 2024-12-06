export class RateLimiter {
  constructor(maxRequests = 100, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    // 清理过期请求
    this.requests = this.requests.filter(time => 
      now - time < this.timeWindow
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
    return true;
  }
}

// 使用示例
const rateLimiter = new RateLimiter(30, 60000); // 每分钟30个请求

async function makeRequest() {
  await rateLimiter.acquire();
  // 执行请求
} 