class TrendsSidebar {
  constructor() {
    this.sidebarId = 'google-trends-sidebar';
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    console.log('Initializing sidebar...');
    this.setupMessageListeners();
    this.initialized = true;
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Received message:', request);
      
      if (request.action === 'checkSidebar') {
        sendResponse({ exists: true });
        return true;
      }
      
      if (request.action === 'toggleSidebar') {
        this.ensureSidebarExists();
        this.toggle();
        sendResponse({ success: true });
        return true;
      }
    });
  }

  ensureSidebarExists() {
    if (document.getElementById(this.sidebarId)) return;
    
    console.log('Creating sidebar elements...');
    
    // 创建 sidebar 容器
    const sidebar = document.createElement('div');
    sidebar.id = this.sidebarId;
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.id = 'sidebar-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.hide();
    
    // 创建 iframe
    const iframe = document.createElement('iframe');
    const popupUrl = chrome.runtime.getURL('public/popup.html');
    iframe.src = popupUrl;
    iframe.allow = "scripts";
    
    // 监听 iframe 加载
    iframe.onload = () => {
      console.log('Sidebar iframe loaded');
      iframe.contentWindow.postMessage({ type: 'SIDEBAR_READY' }, '*');
    };
    
    iframe.onerror = (error) => {
      console.error('Sidebar iframe error:', error);
    };
    
    // 组装 sidebar
    sidebar.appendChild(closeBtn);
    sidebar.appendChild(iframe);
    document.body.appendChild(sidebar);
  }

  show() {
    console.log('Showing sidebar');
    const sidebar = document.getElementById(this.sidebarId);
    if (sidebar) {
      sidebar.classList.add('visible');
    }
  }

  hide() {
    console.log('Hiding sidebar');
    const sidebar = document.getElementById(this.sidebarId);
    if (sidebar) {
      sidebar.classList.remove('visible');
    }
  }

  toggle() {
    console.log('Toggling sidebar');
    const sidebar = document.getElementById(this.sidebarId);
    if (sidebar) {
      sidebar.classList.toggle('visible');
    }
  }
}

// 初始化
console.log('Creating TrendsSidebar instance');
const sidebar = new TrendsSidebar();
window.trendsSidebar = sidebar; 