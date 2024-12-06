export class RetryHelper {
  static async retry(fn, retries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
        }
      }
    }
    
    throw lastError;
  }
} 