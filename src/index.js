export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      const { region, hl, tz, geo } = await request.json();
      
      const response = await fetch(
        `https://trends.google.com/trends/api/dailytrends?` +
        `hl=${hl}&tz=${tz}&geo=${geo}&ns=15`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          }
        }
      );

      const text = await response.text();
      const jsonText = text.replace(/^\)\]\}',\n/, '');
      const data = JSON.parse(jsonText);

      const trends = data.default.trendingSearchesDays[0].trendingSearches
        .map(trend => ({
          title: { query: trend.title.query || trend.title },
          formattedTraffic: trend.formattedTraffic || '100,000+',
          relatedQueries: trend.relatedQueries?.rankedList?.[0]?.rankedKeyword?.map(k => k.query) || [],
          articles: trend.articles || [],
          description: trend.articles?.[0]?.snippet || '',
          timestamp: Date.now(),
          platform: 'google'
        }));

      return new Response(JSON.stringify({ trends }), { headers });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error.message,
          stack: error.stack 
        }), 
        { 
          status: 500,
          headers 
        }
      );
    }
  }
}; 