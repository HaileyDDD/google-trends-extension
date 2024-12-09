console.log('=== POPUP.JS LOADED ===');

document.addEventListener('DOMContentLoaded', async () => {
  // 移除弹窗提示
  // alert('弹出窗口已加载');
  console.log('=== DOM CONTENT LOADED ===');
  
  // 初始化界面
  initializeUI();
  
  // 初始加载数据
  await loadSavedTrends();
});

function initializeUI() {
  // 设置窗口样式
  document.body.style.width = '400px';
  document.body.style.height = '100vh';
  
  // 初始化事件监听
  const fetchButton = document.getElementById('fetchButton');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortBy');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const showAllBtn = document.getElementById('showAllBtn');
  
  // 添加事件监听器
  fetchButton?.addEventListener('click', handleFetchClick);
  searchInput?.addEventListener('input', safeHandleSearch);
  sortSelect?.addEventListener('change', safeHandleSort);
  exportCsvBtn?.addEventListener('click', exportKeywordData);
  exportJsonBtn?.addEventListener('click', exportToJSON);
  showAllBtn?.addEventListener('click', safeShowFullList);
}

// 处理获取数据的点击事件
async function handleFetchClick() {
  try {
    showLoading(true);
    
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
    
    if (response.success) {
      await loadSavedTrends();
    } else {
      throw new Error(response.error || '获取数据失败');
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

async function loadSavedTrends() {
  console.log('执行 loadSavedTrends...');
  try {
    const { keywords } = await chrome.storage.local.get(['keywords']);
    console.log('从存储中获取的数据:', keywords);
    
    const trendsList = document.getElementById('trends-list');
    const showAllBtn = document.getElementById('showAllBtn');
    const errorContainer = document.getElementById('error-container');

    if (!trendsList || !showAllBtn) {
      throw new Error('找��到必要的DOM');
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
  // 将流���据转换为"xx万+"格式
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
    ['关键词', '英文翻译', '类别', '流量情况', '发布时间', '相关搜索', '相关搜索翻译', '描述', '描述翻译', 'Google Trends 链接'],
    ...window.allTrends.map(trend => {
      const trendsUrl = `https://trends.google.com/trends/explore?geo=${trend.region || 'US'}&q=${encodeURIComponent(trend.title.query)}`;
      
      return [
        trend.title.query,
        trend.title.translation || '',
        trend.category || '其他',
        trend.formattedTraffic,
        formatDate(trend.timestamp),
        trend.relatedQueries.map(q => q.query).join('; '),
        trend.relatedQueries.map(q => q.translation).join('; '),
        trend.description,
        trend.descriptionTranslation || '',
        trendsUrl
      ];
    })
  ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `google-trends-${formatDateForFilename(new Date())}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
} 

window.onerror = function(message, source, lineno, colno, error) {
  console.error('全局错误:', { message, source, lineno, colno, error });
  showError(`发生错误: ${message}`);
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处的 Promise 错误:', event.reason);
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
  const trendsUrl = `https://trends.google.com/trends/explore?geo=${trend.region || 'US'}&q=${encodeURIComponent(trend.title.query)}`;
  
  return `
    <div class="trend-item">
      <div class="trend-header">
        <div class="trend-meta">
          <span class="platform-tag">${trend.platform || 'Google Trends'}</span>
          <span class="region-tag">${trend.region || 'US'}</span>
          <span class="category-tag ${trend.category}">${trend.category || '其他'}</span>
        </div>
        <div class="trend-keyword">
          <span class="keyword-text">${trend.title.query}</span>
          <a href="${trendsUrl}" target="_blank" class="trend-link">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </a>
          <span class="translation">${trend.title.translation || ''}</span>
        </div>
      </div>

      <div class="trend-stats">
        <div class="stat-item">
          <div class="stat-label">发布时间</div>
          <div class="stat-value">${formatDate(trend.timestamp)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">搜索热度</div>
          <div class="stat-value highlight">${trend.formattedTraffic}</div>
        </div>
      </div>

      <div class="trend-content">
        <div class="description">
          <div class="section-title">关键词解释</div>
          <div class="description-text">
            ${trend.description}
            <span class="translation">${trend.descriptionTranslation || ''}</span>
          </div>
        </div>

        <div class="related-queries">
          <div class="section-title">相关搜索</div>
          <div class="query-tags">
            ${trend.relatedQueries.map(q => `
              <span class="query-tag">
                <span class="query-text">${q.query}</span>
                <span class="translation">${q.translation || ''}</span>
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// 修改显示完整列表的函数
function showFullList() {
  // 创建对话框元素（如果不存在）
  let dialog = document.getElementById('fullListDialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'fullListDialog';
    dialog.className = 'dialog-overlay';
    
    dialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h2>所有趋势</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div id="fullTrendsList" class="dialog-body"></div>
      </div>
    `;
    
    document.body.appendChild(dialog);
  }

  const fullList = dialog.querySelector('#fullTrendsList');
  
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
  if (!window.allTrends) return;

  const jsonData = window.allTrends.map(trend => ({
    ...trend,
    // 加 Google Trends 搜索链接
    trendsUrl: `https://trends.google.com/trends/explore?geo=${trend.region || 'US'}&q=${encodeURIComponent(trend.title.query)}`
  }));

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
    type: 'application/json;charset=utf-8;' 
  });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `google-trends-${formatDateForFilename(new Date())}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// 修改日期格式化函数，使其更适合文件名
function formatDateForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}`;
}

// 添加处理搜索的函数
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const trends = window.allTrends || [];
  
  // 过滤趋势
  const filteredTrends = trends.filter(trend => {
    const searchText = [
      trend.title.query,
      trend.title.translation,
      trend.description,
      trend.descriptionTranslation,
      trend.category,
      ...trend.relatedQueries.map(q => q.query),
      ...trend.relatedQueries.map(q => q.translation)
    ].join(' ').toLowerCase();
    
    return searchText.includes(searchTerm);
  });

  // 更新显示
  const trendsList = document.getElementById('trends-list');
  trendsList.innerHTML = filteredTrends
    .slice(0, 3)
    .map(trend => generateTrendHTML(trend))
    .join('');
  
  // 更新计数
  const showAllBtn = document.getElementById('showAllBtn');
  if (showAllBtn) {
    showAllBtn.textContent = filteredTrends.length;
  }
}

// 添加处理排序的函数
function handleSort(e) {
  const sortBy = e.target.value;
  const trends = window.allTrends || [];
  
  // 排序趋势
  const sortedTrends = [...trends].sort((a, b) => {
    if (sortBy === 'traffic') {
      const trafficA = parseInt(a.formattedTraffic.replace(/[^0-9]/g, ''));
      const trafficB = parseInt(b.formattedTraffic.replace(/[^0-9]/g, ''));
      return trafficB - trafficA;
    } else {
      return b.timestamp - a.timestamp;
    }
  });

  // 更新显示
  const trendsList = document.getElementById('trends-list');
  trendsList.innerHTML = sortedTrends
    .slice(0, 3)
    .map(trend => generateTrendHTML(trend))
    .join('');
}

// 添加错误边界处理
function wrapWithErrorBoundary(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      console.error('操作失败:', error);
      showError(error.message || '操作失败，请稍后重试');
    }
  };
}

// 包装事件处理函数
const safeHandleSearch = wrapWithErrorBoundary(handleSearch);
const safeHandleSort = wrapWithErrorBoundary(handleSort);
const safeShowFullList = wrapWithErrorBoundary(showFullList);