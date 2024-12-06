import { ErrorHandler } from './utils/ErrorHandler.js';
import { Validator } from './utils/Validator.js';
import { RetryHelper } from './utils/RetryHelper.js';
import { RateLimiter } from './utils/RateLimiter.js';
import { CacheManager } from './utils/CacheManager.js';

console.log('=== BACKGROUND.JS LOADED ===');

// 首先定义数据集
const mockDataSets = {
  CN: {
    '1d': [
      {
        title: { query: "双十二购物节" },
        formattedTraffic: "200,000+",
        relatedQueries: ["淘宝", "优惠券", "打折"],
        description: "年末大型网购节日相关搜索"
      },
      {
        title: { query: "考研倒计时" },
        formattedTraffic: "150,000+",
        relatedQueries: ["考研真题", "复习计划", "考研政治"],
        description: "研究生考试相关话题"
      }
    ],
    '3d': [
      {
        title: { query: "国考成绩" },
        formattedTraffic: "300,000+",
        relatedQueries: ["国考分数线", "面试", "公务员"],
        description: "国家公务员考试成绩查询"
      },
      {
        title: { query: "英雄" },
        formattedTraffic: "250,000+",
        relatedQueries: ["技能绍", "攻略", "出装"],
        description: "手游新角色发布"
      },
      {
        title: { query: "新冠疫情" },
        formattedTraffic: "180,000+",
        relatedQueries: ["疫情防控", "新变种", "症状"],
        description: "新冠疫情最新情况"
      }
    ],
    '7d': [
      {
        title: { query: "ChatGPT替代品" },
        formattedTraffic: "180,000+",
        relatedQueries: ["国产AI", "智谱AI", "文心一言"],
        description: "国内AI模型相关搜索"
      },
      {
        title: { query: "年终奖调查" },
        formattedTraffic: "120,000+",
        relatedQueries: ["平均工资", "行业调查", "企业福利"],
        description: "年终奖相关话题讨论"
      }
    ],
    '30d': [
      {
        title: { query: "考研报名" },
        formattedTraffic: "500,000+",
        relatedQueries: ["报名时间", "报考条件", "专业选择"],
        description: "研究生考试报名相关信息"
      },
      {
        title: { query: "元旦假期" },
        formattedTraffic: "450,000+",
        relatedQueries: ["旅游攻略", "门��订", "酒店订"],
        description: "元旦假期出行相关搜索"
      }
    ],
    '90d': [
      {
        title: { query: "Golden Globe Nominations" },
        formattedTraffic: "800,000+",
        relatedQueries: ["nominees", "movies", "TV shows"],
        description: "Award season nominations and predictions"
      },
      {
        title: { query: "Winter Storm Warning" },
        formattedTraffic: "700,000+",
        relatedQueries: ["weather forecast", "snow accumulation", "school closings"],
        description: "Winter weather updates and preparations"
      }
    ]
  },
  US: {
    '1d': [
      {
        title: { query: "NFL Scores" },
        formattedTraffic: "500,000+",
        relatedQueries: ["live stream", "highlights", "standings"],
        description: "National Football League game results"
      },
      {
        title: { query: "Taylor Swift Concert" },
        formattedTraffic: "450,000+",
        relatedQueries: ["tickets", "tour dates", "setlist"],
        description: "Taylor Swift Eras Tour updates"
      }
    ],
    '3d': [
      {
        title: { query: "Stock Market Today" },
        formattedTraffic: "350,000+",
        relatedQueries: ["NASDAQ", "S&P 500", "market news"],
        description: "Financial market updates"
      },
      {
        title: { query: "Weather Forecast" },
        formattedTraffic: "400,000+",
        relatedQueries: ["snow storm", "winter weather", "school closings"],
        description: "Local weather updates"
      }
    ],
    '7d': [
      {
        title: { query: "Apple Vision Pro" },
        formattedTraffic: "600,000+",
        relatedQueries: ["price", "release date", "features"],
        description: "Apple's new mixed reality headset"
      },
      {
        title: { query: "Christmas Shopping" },
        formattedTraffic: "450,000+",
        relatedQueries: ["deals", "gift ideas", "sales"],
        description: "Holiday shopping trends and deals"
      }
    ],
    '30d': [
      {
        title: { query: "Golden Globe Nominations" },
        formattedTraffic: "800,000+",
        relatedQueries: ["nominees", "movies", "TV shows"],
        description: "Award season nominations and predictions"
      },
      {
        title: { query: "Winter Storm Warning" },
        formattedTraffic: "700,000+",
        relatedQueries: ["weather forecast", "snow accumulation", "school closings"],
        description: "Winter weather updates and preparations"
      }
    ],
    '90d': [
      {
        title: { query: "Golden Globe Nominations" },
        formattedTraffic: "800,000+",
        relatedQueries: ["nominees", "movies", "TV shows"],
        description: "Award season nominations and predictions"
      },
      {
        title: { query: "Winter Storm Warning" },
        formattedTraffic: "700,000+",
        relatedQueries: ["weather forecast", "snow accumulation", "school closings"],
        description: "Winter weather updates and preparations"
      }
    ]
  },
  GB: {
    '1d': [
      {
        title: { query: "Premier League" },
        formattedTraffic: "500,000+",
        relatedQueries: ["football", "scores", "fixtures"],
        description: "English Premier League updates and scores"
      }
    ],
    '3d': [ /* ... */ ],
    '7d': [ /* ... */ ],
    '30d': [ /* ... */ ],
    '90d': [ /* ... */ ]
  },
  JP: {
    '1d': [
      {
        title: { query: "東京オリンピック" },
        formattedTraffic: "400,000+",
        relatedQueries: ["スポーツ", "メダル", "選手"],
        description: "東京オリンピックの最新情報"
      }
    ],
    '3d': [ /* ... */ ],
    '7d': [ /* ... */ ],
    '30d': [ /* ... */ ],
    '90d': [ /* ... */ ]
  }
};

const tiktokDataSets = {
  CN: {
    'now 1-H': [
      {
        title: { query: "#摸鱼日常" },
        formattedTraffic: "1.2M",
        relatedQueries: ["职场", "日常", "搞笑"],
        description: "分享办公室生活的有趣瞬间"
      },
      {
        title: { query: "#宠物日常" },
        formattedTraffic: "800K",
        relatedQueries: ["猫咪", "狗狗", "萌宠"],
        description: "记录可爱宠物的日常生活"
      }
    ],
    'now 4-H': [
      {
        title: { query: "#美食探店" },
        formattedTraffic: "2.5M",
        relatedQueries: ["美食", "探店", "小吃"],
        description: "分各地美食探店经历"
      }
    ]
  },
  US: {
    'now 1-H': [
      {
        title: { query: "#FYP" },
        formattedTraffic: "2.5M",
        relatedQueries: ["viral", "trending", "foryou"],
        description: "For You Page trending content"
      },
      {
        title: { query: "#DanceChallenge" },
        formattedTraffic: "1.8M",
        relatedQueries: ["dance", "music", "viral"],
        description: "Popular dance challenge videos"
      }
    ],
    'now 4-H': [
      {
        title: { query: "#CookingTikTok" },
        formattedTraffic: "1.5M",
        relatedQueries: ["recipe", "cooking", "food"],
        description: "Cooking and recipe videos"
      }
    ]
  }
};

// 初始���工具
const rateLimiter = new RateLimiter();
const cacheManager = new CacheManager(chrome.storage.local);

// 然后定义消息监听器和其他函数
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchTrends') {
    console.log('收到获取趋势请求:', request.params);
    
    // 立即返回 true 表示我们会异步发送响应
    fetchTrends(request.params)
      .then(result => {
        console.log('获:', result);
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('获取趋势失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '获取数据失败'
        });
      });
    
    return true; // 保持消通道开启
  }
});

// 定时获取热门趋势
chrome.alarms.create('fetchTrends', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'fetchTrends') {
    fetchTrends();
  }
});

// 添加数据刷新逻辑
chrome.alarms.create('refreshTrends', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshTrends') {
    // 通知所有打开的 popup 刷新数据
    chrome.runtime.sendMessage({ action: 'refreshData' });
  }
});

// 添加日志��具
const logger = {
  debug: (...args) => console.debug('[Trends]', ...args),
  info: (...args) => console.info('[Trends]', ...args),
  warn: (...args) => console.warn('[Trends]', ...args),
  error: (...args) => console.error('[Trends]', ...args)
};

// 修改数据源配置
const API_CONFIG = {
  WEIBO: 'https://weibo.com/ajax/side/hotSearch',
  BAIDU: 'https://top.baidu.com/api/board?platform=wise&tab=realtime'
};

// 添加翻译函数
async function translateText(text, targetLang = 'en') {
  try {
    // 使用 Google Translate API
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error('翻译失败:', error);
    return text;
  }
}

// 修改 fetchGoogleTrendsData 函数
async function fetchGoogleTrendsData(params) {
  const { region = 'CN', timeRange = '1d' } = params;
  
  try {
    const url = new URL('https://trends.google.com/trends/api/dailytrends');
    url.searchParams.set('hl', region === 'CN' ? 'zh-CN' : region);
    url.searchParams.set('tz', '-480');
    url.searchParams.set('geo', region);
    url.searchParams.set('ns', '15');

    // 根据时间范围设置日期参数
    const dates = getDateRange(timeRange);
    url.searchParams.set('ed', dates.end);
    url.searchParams.set('sd', dates.start);  // 添加开始日期

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
        'Accept': 'application/json',
        'Accept-Language': region === 'CN' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
        'Referer': 'https://trends.google.com/trends/explore',
        'Origin': 'https://trends.google.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      // 如果是 CN 地区且失败，尝试使用 HK 地区
      if (region === 'CN') {
        console.log('尝试用 HK 地区数据...');
        return fetchGoogleTrendsData({ ...params, region: 'HK' });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    // 移除 Google Trends API 响应前缀 ")]}'," 并获取实际的 JSON
    const jsonText = text.substring(text.indexOf('\n') + 1);
    const data = JSON.parse(jsonText);

    // 修改数据转换部分，添加翻译
    const trends = await Promise.all(data.default.trendingSearchesDays[0].trendingSearches.map(async trend => {
      const query = trend.title.query || trend.title;
      let translation = query;
      
      // 如果是中文且需要英文翻译，或者是英文且需要中文翻译
      if ((region === 'CN' && /[\u4e00-\u9fa5]/.test(query)) || 
          (region !== 'CN' && !/[\u4e00-\u9fa5]/.test(query))) {
        translation = await translateText(query, region === 'CN' ? 'en' : 'zh-CN');
      }

      return {
        title: { 
          query,
          translation
        },
        formattedTraffic: trend.formattedTraffic || '100,000+',
        relatedQueries: await Promise.all(
          (trend.relatedQueries?.rankedList?.[0]?.rankedKeyword?.map(k => k.query) || [])
            .map(async q => ({
              query: q,
              translation: await translateText(q, region === 'CN' ? 'en' : 'zh-CN')
            }))
        ),
        articles: await Promise.all(
          (trend.articles || []).map(async article => ({
            title: article.title,
            titleTranslation: await translateText(article.title, region === 'CN' ? 'en' : 'zh-CN'),
            snippet: article.snippet,
            snippetTranslation: await translateText(article.snippet, region === 'CN' ? 'en' : 'zh-CN'),
            url: article.url
          }))
        ),
        description: trend.articles?.[0]?.snippet || trend.title.query,
        descriptionTranslation: await translateText(
          trend.articles?.[0]?.snippet || trend.title.query,
          region === 'CN' ? 'en' : 'zh-CN'
        ),
        timestamp: new Date(trend.formattedDate).getTime() || Date.now(),
        platform: 'google'
      };
    }));

    return trends;
  } catch (error) {
    console.error('获取 Google Trends 数据失败:', error);
    return mockDataSets[region]?.[timeRange] || [];
  }
}

// 添加日期范围计算函数
function getDateRange(timeRange) {
  const end = new Date();
  const start = new Date();
  
  switch (timeRange) {
    case '3d':
      start.setDate(end.getDate() - 3);
      break;
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default: // '1d'
      start.setDate(end.getDate() - 1);
  }

  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

// 修改日期格式化函数
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 添加认证检查函数
async function checkGoogleAuth() {
  try {
    const response = await fetch('https://trends.google.com/trends/explore', {
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    console.error('认证检查失败:', error);
    return false;
  }
}

// 修改 fetchTrends 函数
async function fetchTrends(params = {}) {
  const { platform = 'google', region = 'CN', timeRange = '1d' } = params;
  console.log('开始获取趋势数据:', { platform, region, timeRange });

  try {
    let data = [];
    if (platform === 'google') {
      // 对于中国地区，直接使用香港地区的数据
      const actualRegion = region === 'CN' ? 'HK' : region;
      
      const url = new URL('https://trends.google.com/trends/api/dailytrends');
      url.searchParams.set('hl', actualRegion === 'HK' ? 'zh-HK' : region);
      url.searchParams.set('tz', '-480');
      url.searchParams.set('geo', actualRegion);
      url.searchParams.set('ns', '15');

      // 获取指定日期的数据
      const date = new Date();
      if (timeRange !== '1d') {
        const days = parseInt(timeRange);
        date.setDate(date.getDate() - days);
      }
      url.searchParams.set('ed', formatDate(date));

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
          'Accept': 'application/json',
          'Accept-Language': actualRegion === 'HK' ? 'zh-HK,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
          'Referer': 'https://trends.google.com/trends/explore',
          'Origin': 'https://trends.google.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      // 移除 Google Trends API 响应前缀
      const jsonText = text.substring(text.indexOf('\n') + 1);
      const rawData = JSON.parse(jsonText);

      // 转换数据格式
      data = await Promise.all(rawData.default.trendingSearchesDays[0].trendingSearches.map(async trend => {
        const query = trend.title.query || trend.title;
        const translation = await translateText(query, region === 'CN' ? 'en' : 'zh-CN');

        return {
          title: { 
            query,
            translation
          },
          formattedTraffic: trend.formattedTraffic || '100,000+',
          relatedQueries: await Promise.all(
            (trend.relatedQueries?.rankedList?.[0]?.rankedKeyword?.map(k => k.query) || [])
              .map(async q => ({
                query: q,
                translation: await translateText(q, region === 'CN' ? 'en' : 'zh-CN')
              }))
          ),
          articles: trend.articles?.map(article => ({
            title: article.title,
            snippet: article.snippet,
            url: article.url
          })) || [],
          description: trend.articles?.[0]?.snippet || trend.title.query,
          descriptionTranslation: await translateText(
            trend.articles?.[0]?.snippet || trend.title.query,
            region === 'CN' ? 'en' : 'zh-CN'
          ),
          timestamp: date.getTime(),
          platform: 'google',
          region,
          date: formatDate(date)
        };
      }));
    }

    // 验证数据
    const validationResults = await validateTrendsData(data, region);
    
    // 过滤掉无效数据
    const validTrends = data.filter((trend, index) => 
      validationResults[index].isValid
    );

    // 记录验证结果
    console.log('数据验证结果:', validationResults);
    
    if (validTrends.length < data.length) {
      console.warn(`过滤掉 ${data.length - validTrends.length} 条无效数据`);
    }

    data = validTrends;

    // 保存到存储
    if (data.length > 0) {
      await chrome.storage.local.set({ 
        keywords: data.reduce((acc, trend) => {
          acc[trend.title.query] = trend;
          return acc;
        }, {}),
        lastUpdate: new Date().toISOString()
      });
    }

    return data;
  } catch (error) {
    console.error('获取趋势失败:', error);
    throw error;
  }
}

// 修改 fetchTikTokData 函数
async function fetchTikTokData(params) {
  const { region = 'CN', timeRange = 'now 1-H' } = params;
  
  try {
    // 直接返回模拟数据，因为 TikTok API 需要认证
    const mockData = tiktokDataSets[region]?.[timeRange];
    if (!mockData) {
      throw new Error('No data available for the specified region and time range');
    }
    return mockData;
  } catch (error) {
    console.error('获取 TikTok 数据失败:', error);
    return [];
  }
}

// 辅助函数：格式化流量据
function formatTraffic(count) {
  if (count >= 1000000) {
    return `${Math.floor(count/1000000)}M+`;
  }
  if (count >= 1000) {
    return `${Math.floor(count/1000)}K+`;
  }
  return `${count}+`;
}

// 扩展分类关键词
const CATEGORIES = {
  '科技': [
    'AI', '人工智能', '手机', '电脑', 'iPhone', 'Android', '软件', '应用',
    'tech', 'technology', 'smartphone', 'computer', 'software', 'app'
  ],
  '娱乐': [
    '电影', '音乐', '游戏', '视频', '直播', '演唱会', '综艺',
    'movie', 'music', 'game', 'video', 'live', 'concert', 'show'
  ],
  '体育': [
    '足球', '篮球', '网球', '比赛', '联赛', '冠军', 'NBA', '世界杯',
    'football', 'basketball', 'tennis', 'match', 'league', 'champion'
  ],
  '商业': [
    '股票', '经济', '企业', '市场', '投资', '金融', '贸易',
    'stock', 'economy', 'business', 'market', 'investment', 'finance'
  ],
  '社会': [
    '政治', '教育', '医疗', '环境', '社会', '事件', '新闻',
    'politics', 'education', 'medical', 'environment', 'society', 'news'
  ],
  '生活': [
    '美食', '旅游', '购物', '时尚', '健康', '生活', '家居',
    'food', 'travel', 'shopping', 'fashion', 'health', 'lifestyle'
  ],
  '文化': [
    '艺术', '文学', '历史', '展览', '节日', '传统',
    'art', 'literature', 'history', 'exhibition', 'festival', 'tradition'
  ]
};

// 改进分类函数
async function categorizeKeyword(keyword, description) {
  const text = `${keyword} ${description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => text.includes(k.toLowerCase()))) {
      return category;
    }
  }
  
  return '其他';
}

// 修改数据处理部分
async function processGoogleTrendsData(trend, region) {
  const query = trend.title.query || trend.title;
  const description = trend.articles?.[0]?.snippet || trend.title.query;
  const category = await categorizeKeyword(query, description);

  return {
    title: { 
      query,
      translation: await translateText(query, region === 'CN' ? 'en' : 'zh-CN')
    },
    category,
    formattedTraffic: trend.formattedTraffic || '100,000+',
    relatedQueries: await Promise.all(
      (trend.relatedQueries?.rankedList?.[0]?.rankedKeyword?.map(k => k.query) || [])
        .map(async q => ({
          query: q,
          translation: await translateText(q, region === 'CN' ? 'en' : 'zh-CN')
        }))
    ),
    articles: trend.articles?.map(article => ({
      title: article.title,
      snippet: article.snippet,
      url: article.url
    })) || [],
    description,
    descriptionTranslation: await translateText(description, region === 'CN' ? 'en' : 'zh-CN'),
    timestamp: Date.now(),
    platform: 'google',
    region
  };
}

// 添加数据验证函数
async function validateTrendsData(trends, region) {
  // 验证结果数组
  const validationResults = await Promise.all(trends.map(async trend => {
    try {
      // 1. 直接验证 Google Trends 链接
      const trendsUrl = `https://trends.google.com/trends/explore?geo=${region}&q=${encodeURIComponent(trend.title.query)}`;
      const response = await fetch(trendsUrl);
      const isValidTrend = response.ok;

      // 2. 验证搜索量
      const searchVolume = parseInt(trend.formattedTraffic.replace(/[^0-9]/g, ''));
      const hasReasonableVolume = searchVolume > 0 && searchVolume < 10000000;

      // 3. 验证时间戳
      const isRecentTimestamp = (Date.now() - trend.timestamp) < 24 * 60 * 60 * 1000; // 24小时内

      // 4. 验证相关内容
      const hasRelatedContent = trend.relatedQueries.length > 0 || trend.articles.length > 0;

      return {
        keyword: trend.title.query,
        isValid: isValidTrend && hasReasonableVolume && isRecentTimestamp && hasRelatedContent,
        validationDetails: {
          validTrend: isValidTrend,
          reasonableVolume: hasReasonableVolume,
          recentTimestamp: isRecentTimestamp,
          hasRelatedContent
        }
      };
    } catch (error) {
      console.error(`验证失败 (${trend.title.query}):`, error);
      return {
        keyword: trend.title.query,
        isValid: false,
        error: error.message
      };
    }
  }));

  return validationResults;
}

// 添加到 background.js 的顶部
chrome.action.onClicked.addListener(function(tab) {
  // 当用户点击扩展图标时，打开侧边栏
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 确保侧边栏在所有页面都可用
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    enabled: true,
    path: 'public/popup.html'
  });
});
  