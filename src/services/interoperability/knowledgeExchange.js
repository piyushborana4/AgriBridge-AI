import { knowledgeArticles, bricsPartners } from '../../data/mockData';

export function getKnowledgeArticles(category = 'all', searchTerm = '') {
  return knowledgeArticles.filter(article => {
    const matchesCat = category === 'all' || article.category.toLowerCase() === category.toLowerCase();
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });
}

export function getBRICSPartners() {
  return bricsPartners;
}
