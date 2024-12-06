console.log('=== POPUP.JS LOADED ===');

document.addEventListener('DOMContentLoaded', async () => {
  alert('弹出窗口已加载');
  console.log('=== DOM CONTENT LOADED ===');
  const fetchButton = document.getElementById('fetchButton');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const searchInput = document.getElementById('searchInput');
  
  // 初始加载已保存的数据
  console.log('开始加载已保存数据...');
  await loadSavedTrends();
  
  // 添加搜索功能
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterTrends(searchTerm);
  });
  
  // 添加查询按钮事件
  fetchButton.addEventListener('click', async () => {
    try {
      showLoading(true); // 显示加载指示器
      
      const params = {
        platform: document.getElementById('platform').value,
        region: document.getElementById('region').value,
        timeRange: document.getElementById('timeRange').value
      };
      
      console.log('发送获取趋势请求:', params);
      
      const response = await chrome.runtime.sendMessage({ 
        action: 'fetchTrends',
        params
      });
      
      console.log('获取趋势响应:', response);
      
      if (response.success) {
        await loadSavedTrends();
      } else {
        throw new Error(response.error || '获取数据失败');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      showError(error.message || '获取数据失败，请稍后重试');
    } finally {
      showLoading(false); // 隐藏加载指示器
    }
  });

  // 排序功能
  document.getElementById('sortBy').addEventListener('change', (e) => {
    const sortBy = e.target.value;
    sortTrends(sortBy);
  });

  document.getElementById('exportBtn').addEventListener('click', exportKeywordData);
  document.getElementById('showAllBtn').addEventListener('click', showFullList);
});

async function loadSavedTrends() {
  console.log('执行 loadSavedTrends...');
  try {
    const { keywords } = await chrome.storage.local.get(['keywords']);
    console.log('从存储中获取的数据:', keywords);
    
    const trendsList = document.getElementById('trends-list');
    const showAllBtn = document.getElementById('showAllBtn');
    const errorContainer = document.getElementById('error-container');

    if (!trendsList || !showAllBtn) {
      throw new Error('找不到必要的DOM');
    }

    // 清除错误提示
    errorContainer.classList.add('hidden');
    errorContainer.textContent = '';

    if (keywords && Object.keys(keywords).length > 0) {
      console.log('开始渲染趋势列表...');
      const trends = Object.values(keywords);
      
      // 更新数量显示
      showAllBtn.textContent = trends.length;
      
      // 显示趋势列表
      const previewTrends = trends.slice(0, 3);
      trendsList.innerHTML = previewTrends.map(trend => generateTrendHTML(trend)).join('');
      
      // 保存完整数据用于导出
      window.allTrends = trends;
      
      console.log('趋势列表渲染完成');
    } else {
      console.log('没有找到数据，显示提示信息');
      showAllBtn.textContent = '0';
      trendsList.innerHTML = '<div class="no-data">暂无数据，请点击上方按钮获取最新热词</div>';
    }
  } catch (error) {
    console.error('加载趋势数据失败:', error);
    showError(error.message);
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 UTC+8 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function formatTraffic(traffic) {
  // 将流量数据转换为"xx万+"格式
  const num = parseInt(traffic.replace(/[^0-9]/g, ''));
  return `${Math.round(num / 10000)}万+`;
}

function generateDescription(trend) {
  // 根据关键词和相关查询生成描述
  const relatedTerms = trend.relatedQueries.slice(0, 3).join('、');
  return `${trend.keyword}是一个热门搜索词，主要与${relatedTerms}等主题相关。`;
}

function sortTrends(sortBy) {
  const trendsList = document.getElementById('trends-list');
  const trends = Array.from(trendsList.children);

  trends.sort((a, b) => {
    if (sortBy === 'traffic') {
      const trafficA = parseInt(a.querySelector('.trend-traffic').textContent.replace(/[^0-9]/g, ''));
      const trafficB = parseInt(b.querySelector('.trend-traffic').textContent.replace(/[^0-9]/g, ''));
      return trafficB - trafficA;
    } else {
      const timeA = new Date(a.querySelector('.trend-time').textContent.split(': ')[1]);
      const timeB = new Date(b.querySelector('.trend-time').textContent.split(': ')[1]);
      return timeB - timeA;
    }
  });

  trendsList.innerHTML = '';
  trends.forEach(trend => trendsList.appendChild(trend));
} 

function renderKeywordDetails(keyword) {
  const detailsHtml = `
    <div class="keyword-analysis">
      <h2>${keyword.keyword}</h2>
      <div class="metrics">
        <div class="metric">
          <label>SEO得分</label>
          <div class="score">${keyword.seoScore}/100</div>
        </div>
        <div class="metric">
          <label>增长趋势</label>
          <div class="growth ${keyword.growthRate > 0 ? 'positive' : 'negative'}">
            ${keyword.growthRate}%
          </div>
        </div>
        <div class="metric">
          <label>竞争</label>
          <div class="competition">${keyword.competitionLevel}</div>
        </div>
      </div>
      <div class="suggestions">
        <h3>SEO建议</h3>
        <ul>
          ${generateSEOSuggestions(keyword).map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <div class="related-keywords">
        <h3>相关关键词</h3>
        <div class="keyword-cloud">
          ${keyword.relatedQueries.map(q => `
            <span class="keyword-tag">${q}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('keyword-details').innerHTML = detailsHtml;
} 

function exportKeywordData() {
  if (!window.allTrends) return;
  
  const csvContent = [
    ['关键词', '流量情况', '发布时间', '相关查询', '描述'],
    ...window.allTrends.map(trend => [
      trend.keyword,
      trend.traffic,
      formatDate(trend.timestamp),
      trend.relatedQueries.join('; '),
      trend.description || ''
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `google-trends-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
} 

window.onerror = function(message, source, lineno, colno, error) {
  console.error('全局错误:', { message, source, lineno, colno, error });
  showError(`发生错误: ${message}`);
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的 Promise 错误:', event.reason);
  showError(`Promise 错误: ${event.reason.message || '未知错误'}`);
});

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
      errorContainer.classList.add('hidden');
    }, 3000);
  }
}

// 添加搜索过滤功能
function filterTrends(searchTerm) {
  const trends = document.querySelectorAll('.trend-item');
  trends.forEach(trend => {
    const text = trend.textContent.toLowerCase();
    trend.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// 修改生成趋势 HTML 的函数
function generateTrendHTML(trend) {
  // 构建 Google Trends 搜索链接
  const trendsUrl = `https://trends.google.com/trends/explore?geo=${trend.region || 'US'}&q=${encodeURIComponent(trend.title.query)}`;
  
  return `
    <div class="trend-item">
      <div class="trend-header">
        <div class="trend-source">
          <span class="platform-tag">${trend.platform || 'Google Trends'}</span>
          <span class="region-tag">${trend.region || 'US'}</span>
        </div>
        <div class="trend-keyword">
          <span class="keyword-text">${trend.title.query}</span>
          <a href="${trendsUrl}" target="_blank" class="trend-link" title="在 Google Trends 中查看">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </a>
          <span class="translation">${trend.title.translation || ''}</span>
        </div>
      </div>

      <div class="trend-stats">
        <div class="trend-time">
          发布时间: ${formatDate(trend.timestamp)}
        </div>
        <div class="trend-traffic">
          搜索热度: ${trend.formattedTraffic}
        </div>
      </div>

      <div class="trend-description">
        <div class="description-title">关键词解释:</div>
        <div class="description-content">
          ${trend.description}
          <span class="translation">${trend.descriptionTranslation || ''}</span>
        </div>
      </div>

      <div class="related-queries">
        <div class="queries-title">相关搜索:</div>
        ${trend.relatedQueries.map(q => `
          <span class="query-tag">
            ${q.query}
            <span class="translation">${q.translation || ''}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

// 显示完整列表的函数
function showFullList() {
  const dialog = document.getElementById('fullListDialog');
  const fullList = document.getElementById('fullTrendsList');
  
  if (window.allTrends) {
    fullList.innerHTML = window.allTrends.map(trend => generateTrendHTML(trend)).join('');
  }
  
  dialog.classList.remove('hidden');
  
  // 添加关闭功能
  dialog.querySelector('.close-btn').onclick = () => dialog.classList.add('hidden');
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.classList.add('hidden');
  };
}

function showLoading(show) {
  const fetchButton = document.getElementById('fetchButton');
  const loadingIndicator = document.querySelector('.loading-indicator');
  
  if (fetchButton) {
    fetchButton.disabled = show;
  }
  
  if (loadingIndicator) {
    loadingIndicator.classList.toggle('hidden', !show);
  }
}

function exportToCSV() {
  const trends = getAllTrends();
  const csv = convertToCSV(trends);
  downloadFile(csv, 'trends.csv', 'text/csv');
}

function exportToJSON() {
  const trends = getAllTrends();
  const json = JSON.stringify(trends, null, 2);
  downloadFile(json, 'trends.json', 'application/json');
}