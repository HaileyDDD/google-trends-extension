async function batchAnalyzeKeywords(keywords) {
  const results = [];
  for (const keyword of keywords) {
    const analysis = await analyzeTrend(keyword);
    results.push(analysis);
  }
  return results;
} 