console.log('=== BACKGROUND.JS LOADED ===');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('=== MESSAGE RECEIVED ===', request);
  if (request.action === 'fetchTrends') {
    console.log('开始获取趋势数据...');
    fetchTrends()
      .then(result => {
        console.log('获取趋势数据成功:', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('获取趋势数据失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 表示会异步发送响应
  }
});

// 定时获取热门趋势
chrome.alarms.create('fetchTrends', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchTrends') {
    fetchTrends();
  }
});

async function fetchTrends() {
  console.log('执行 fetchTrends...');
  try {
    // 使用示例数据进行测试
    const mockData = {
      default: {
        trendingSearchesDays: [{
          trendingSearches: [
            {
              title: { query: "snow day calculator" },
              formattedTraffic: "200,000+",
              relatedQueries: ["school closing", "weather forecast", "snow storm"],
              description: "雪天计算器是一种用于确定是否可以在雪天停课或放假的工具"
            },
            {
              title: { query: "ChatGPT" },
              formattedTraffic: "500,000+",
              relatedQueries: ["AI", "OpenAI", "人工智能"],
              description: "ChatGPT是一个流行的AI聊天机器人"
            }
          ]
        }]
      }
    };

    console.log('模拟数据:', mockData);

    // 分析所有趋势
    const analyzedTrends = await Promise.all(
      mockData.default.trendingSearchesDays[0].trendingSearches.map(trend => ({
        keyword: trend.title.query,
        traffic: trend.formattedTraffic,
        relatedQueries: trend.relatedQueries || [],
        timestamp: Date.now(),
        description: trend.description
      }))
    );
    
    console.log('处理后的趋势数据:', analyzedTrends);

    // 存储分析后的数据
    await chrome.storage.local.set({ 
      keywords: analyzedTrends.reduce((acc, trend) => {
        acc[trend.keyword] = trend;
        return acc;
      }, {}),
      lastUpdate: new Date().toISOString()
    });

    console.log('数据已存储到 chrome.storage.local');

    // 注释掉通知代码
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: 'public/icons/icon128.png',
    //   title: '热门趋势更新',
    //   message: `已获取 ${analyzedTrends.length} 个热门趋势`
    // });

    return { success: true, data: analyzedTrends };
  } catch (error) {
    console.error('获取趋势失败:', error);
    throw error;
  }
}

async function analyzeTrend(trend) {
  const keywordData = {
    keyword: trend.title.query,
    traffic: trend.formattedTraffic,
    relatedQueries: [],
    growthRate: 0,
    seoScore: 0,
    competitionLevel: '',
    historicalData: []
  };

  try {
    // 获取相关查询
    const relatedData = await fetch(`https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=zh-CN&tz=-480&req={"restriction":{"geo":"CN","time":"today 12-m","term":"${trend.title.query}"}}`);
    const relatedJson = JSON.parse(relatedData.text().substring(5));
    keywordData.relatedQueries = extractRelatedQueries(relatedJson);
    
    // 计算SEO分数
    keywordData.seoScore = calculateSEOScore(keywordData);
    
    // 生成SEO建议
    keywordData.suggestions = generateSEOSuggestions(keywordData);
    
    return keywordData;
  } catch (error) {
    console.error('分析关键词失败:', error);
    return keywordData;
  }
}

function calculateSEOScore(data) {
  let score = 0;
  // 搜索量权重
  score += getTrafficScore(data.traffic) * 0.4;
  // 增长率权重
  score += getGrowthScore(data.growthRate) * 0.3;
  // 竞争度权重
  score += getCompetitionScore(data.competitionLevel) * 0.3;
  return Math.round(score);
}

function generateSEOSuggestions(keyword) {
  return [
    `建议标题: "${keyword.keyword} - 完整指南 [${new Date().getFullYear()}更新]"`,
    `建议创建包含 ${keyword.relatedQueries.slice(0,3).join(', ')} 等相关主题的详内容`,
    `推荐使用相关关键词: ${keyword.relatedQueries.join(', ')}`
  ];
}

async function saveKeywordAnalysis(analyzedTrends) {
  const { keywords = {} } = await chrome.storage.local.get(['keywords']);
  
  const updatedKeywords = analyzedTrends.reduce((acc, trend) => {
    acc[trend.keyword] = {
      ...trend,
      timestamp: Date.now(),
      historicalData: (keywords[trend.keyword]?.historicalData || [])
        .concat({
          date: Date.now(),
          traffic: trend.traffic,
          score: trend.seoScore
        })
        .slice(-30) // 保留30天数据
    };
    return acc;
  }, {});

  await chrome.storage.local.set({ 
    keywords: updatedKeywords,
    lastUpdate: new Date().toISOString()
  });
}

// 辅助函数
function getTrafficScore(traffic) {
  // 实现搜索量评分逻辑
  return 50;
}

function getGrowthScore(growth) {
  // 实现增长率评分逻辑
  return 30;
}

function getCompetitionScore(competition) {
  // 实现竞争度评分逻辑
  return 20;
}

function extractRelatedQueries(data) {
  // 实现相关查询提取逻辑
  return [];
}
  