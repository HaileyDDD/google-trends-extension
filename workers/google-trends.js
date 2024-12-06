addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 允许跨域
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    const { region, hl, tz, geo } = await request.json()
    
    const response = await fetch(
      `https://trends.google.com/trends/api/dailytrends?` +
      `hl=${hl}&tz=${tz}&geo=${geo}&ns=15`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
          'Accept': 'application/json'
        }
      }
    )

    const text = await response.text()
    const jsonText = text.replace(/^\)\]\}',\n/, '')
    const data = JSON.parse(jsonText)

    return new Response(JSON.stringify({
      trends: data.default.trendingSearchesDays[0].trendingSearches
    }), {
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })
  }
} 