function generateSEOSuggestions(keyword) {
  const suggestions = [];
  
  // 标题建议
  suggestions.push(`建议标题: "${keyword.keyword} - 完整指南 [${new Date().getFullYear()}更新]"`);
  
  // 内容结构建议
  suggestions.push(`建议创建包含 ${keyword.relatedQueries.slice(0,3).join(', ')} 等相关主题的详细内容`);
  
  // 长尾关键词建议
  const longTailKeywords = generateLongTailKeywords(keyword);
  suggestions.push(`推荐使用长尾关键词: ${longTailKeywords.join(', ')}`);
  
  return suggestions;
} 