const storage = {
  async saveKeywordAnalysis(analysis) {
    const { keywords } = await chrome.storage.local.get(['keywords']);
    const updatedKeywords = {
      ...keywords,
      [analysis.keyword]: {
        ...analysis,
        timestamp: Date.now(),
        historicalData: (keywords[analysis.keyword]?.historicalData || []).concat({
          date: Date.now(),
          traffic: analysis.traffic,
          score: analysis.seoScore
        }).slice(-30) // 保留30天数据
      }
    };
    await chrome.storage.local.set({ keywords: updatedKeywords });
  }
}; 