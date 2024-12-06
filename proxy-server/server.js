const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

// Google Trends 代理
app.post('/google-trends/api/dailytrends', async (req, res) => {
  try {
    const { region, hl, tz, geo } = req.body;
    
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

    res.json({ trends });
  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`代理服务器运行在端口 ${PORT}`);
}); 