class ChartRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.chart = null;
  }

  // 渲染趋势图表
  renderTrendChart(data, options = {}) {
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              return `增长率: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: value => `${value}%`
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };

    // 销毁现有图表
    if (this.chart) {
      this.chart.destroy();
    }

    // 创建新图表
    this.chart = new Chart(this.ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: '增长率',
          data: data.values,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: { ...defaultOptions, ...options }
    });
  }

  // 更新图表数据
  updateChart(newData) {
    if (this.chart) {
      this.chart.data.labels = newData.labels;
      this.chart.data.datasets[0].data = newData.values;
      this.chart.update();
    }
  }

  // 销毁图表
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // 添加热度地图展示
  renderHeatMap(data) {
    const regions = ['北京', '上海', '广州', '深圳', '杭州']; // 示例城市
    const values = regions.map(() => Math.random() * 100); // 实际应该使用真实数据
    
    new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: regions,
        datasets: [{
          label: '热度分布',
          data: values,
          backgroundColor: values.map(v => 
            `rgba(26, 115, 232, ${v/100})`
          )
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: '地区热度分布'
          }
        }
      }
    });
  }

  // 添加关联词云图
  renderWordCloud(keywords) {
    // 使用 wordcloud2.js 或其他词云库
    WordCloud(this.ctx.canvas, {
      list: keywords.map(k => [k, Math.random() * 100]),
      gridSize: 16,
      weightFactor: 10,
      fontFamily: 'Microsoft YaHei',
      color: '#1a73e8',
      hover: word => {
        // 显示详细信息
      }
    });
  }
}

export { ChartRenderer }; 