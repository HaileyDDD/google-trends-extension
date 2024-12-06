console.log('=== POPUP.JS LOADED ===');

document.addEventListener('DOMContentLoaded', async () => {
  alert('弹出窗口已加载');
  console.log('=== DOM CONTENT LOADED ===');
  const fetchButton = document.getElementById('fetchButton');
  const loadingIndicator = document.querySelector('.loading-indicator');
  
  // 初始加载已保存的数据
  console.log('开始加载已保存数据...');
  await loadSavedTrends();
  
  // 添加手动获取按钮事件
  fetchButton.addEventListener('click', async () => {
    alert('点击了获取按钮');
    console.log('=== FETCH BUTTON CLICKED ===');
    console.log('点击获取按钮');
    try {
      fetchButton.disabled = true;
      loadingIndicator.classList.remove('hidden');
      
      // 调用后台服务获取新数据
      console.log('发送获取数据请求...');
      const response = await chrome.runtime.sendMessage({ action: 'fetchTrends' });
      console.log('收到响应:', response);
      
      if (response.success) {
        console.log('获取数据成功，开始重新加载...');
        // 重新加载数据
        await loadSavedTrends();
      } else {
        console.error('获取数据失败:', response.error);
        throw new Error('获取数据失败');
      }
      
    } catch (error) {
      console.error('处理数据失败:', error);
      alert('获取数据失败，请稍后重试');
    } finally {
      fetchButton.disabled = false;
      loadingIndicator.classList.add('hidden');
    }
  });

  // 排序功能
  document.getElementById('sortBy').addEventListener('change', (e) => {
    sortTrends(e.target.value);
  });
});

async function loadSavedTrends() {
  console.log('执行 loadSavedTrends...');
  const { keywords } = await chrome.storage.local.get(['keywords']);
  console.log('从存储中获取的数据:', keywords);
  
  const trendsList = document.getElementById('trends-list');

  if (keywords && Object.keys(keywords).length > 0) {
    console.log('开始渲染趋势列表...');
    const trends = Object.values(keywords);
    trendsList.innerHTML = trends.map(trend => `
      <div class="trend-item">
        <div class="trend-source">来源: Google Trends</div>
        <div class="trend-keyword">关键词: ${trend.keyword}</div>
        <div class="trend-time">发布时间: ${formatDate(trend.timestamp)}</div>
        <div class="trend-traffic">流量情况: ${trend.traffic}</div>
        <div class="trend-description">
          名词解释: ${trend.description || `${trend.keyword}是一个热门搜索词，主要与${trend.relatedQueries.slice(0,3).join('、')}等主题相关。`}
        </div>
      </div>
    `).join('');
    console.log('趋势列表渲染完成');
  } else {
    console.log('没有找到数据，显示提示信息');
    trendsList.innerHTML = '<div class="no-data">暂无数据，请点击上方按钮获取最新热词</div>';
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
          <label>竞争度</label>
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
  chrome.storage.local.get(['analyzedTrends'], async (result) => {
    const trends = result.analyzedTrends || [];
    
    const csvContent = [
      ['关键词', 'SEO得分', '搜索量', '增长率', '竞争度', '相关关键词'],
      ...trends.map(trend => [
        trend.keyword,
        trend.seoScore,
        trend.traffic,
        trend.growthRate + '%',
        trend.competitionLevel,
        trend.relatedQueries.join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-keywords-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });
} 

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', {message, source, lineno, colno, error});
  alert('发生错误：' + message);
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  alert('未处理的Promise错误：' + event.reason);
});