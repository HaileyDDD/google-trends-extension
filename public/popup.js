async function exportData() {
  const { keywords } = await chrome.storage.local.get(['keywords']);
  const csvContent = convertToCSV(keywords);
  downloadCSV(csvContent, `trends_${new Date().toISOString()}.csv`);
} 