import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { 
  Search, BookOpen, Clock, Tag, Bookmark, BookmarkCheck, 
  Filter, ChevronDown, ChevronRight, X, CheckCircle2, ShieldCheck,
  Globe, AlertTriangle, Layers, Building
} from 'lucide-react';
import { getApprovedKnowledge, detectKnowledgeConflicts } from '../services/interoperability/knowledgeExchangeService';

const TOPICS = [
  'All',
  'Water Management & Irrigation Scheduling',
  'Integrated Pest Management',
  'Crop Water Requirements & ET0',
  'Nutrient Management',
  'Soil Pedology',
  'Climate Adaptation'
];

const COUNTRIES = ['All', 'India', 'Brazil', 'International'];

export default function KnowledgeHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [selectedArticle, setSelectedArticle] = useState(null);

  const articles = useMemo(() => {
    return getApprovedKnowledge();
  }, []);

  const conflictNotice = useMemo(() => {
    return detectKnowledgeConflicts('Onion', 'Water Management & Irrigation Scheduling');
  }, []);

  // Filter articles based on search query, topic, and country
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        article.title?.toLowerCase().includes(q) ||
        article.content?.toLowerCase().includes(q) ||
        article.crop?.toLowerCase().includes(q) ||
        article.source?.toLowerCase().includes(q);
        
      const matchesTopic = selectedTopic === 'All' || article.topic === selectedTopic;
      const matchesCountry = selectedCountry === 'All' || article.country === selectedCountry;
      
      return matchesSearch && matchesTopic && matchesCountry;
    });
  }, [articles, searchQuery, selectedTopic, selectedCountry]);

  const toggleBookmark = (id) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary-600" />
              Agronomic Knowledge Hub &amp; Research Exchange
            </h1>
            <Badge variant="primary" className="text-[10px]">BRICS Validated</Badge>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Peer-reviewed field guidelines, FAO-56 irrigation protocols, and ICAR / Embrapa technical benchmarks
          </p>
        </div>
      </div>

      {/* Conflict Notice if multiple sources offer competing recommendations */}
      {conflictNotice && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-900">
              Multiple Authoritative Guidance Sources Available ({conflictNotice.crop} — {conflictNotice.topic})
            </div>
            <p className="text-amber-800 leading-relaxed">
              {conflictNotice.message} {conflictNotice.resolutionGuidance}
            </p>
          </div>
        </div>
      )}

      {/* Search & Topic Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peer-reviewed literature by crop, topic, institution, or methodology..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-gray-100">
            {/* Country Filters */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600 flex-wrap">
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-semibold text-gray-700">Country:</span>
              {COUNTRIES.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    selectedCountry === c ? 'bg-primary-600 text-white font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Topic Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {TOPICS.slice(0, 4).map(topic => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedTopic === topic
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {topic.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            Verified Knowledge Records
            <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-2">({filteredArticles.length} approved)</span>
          </h2>
        </div>

        {filteredArticles.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No knowledge records match your filter"
            description="Try searching for general crop guidelines or reset the active topic and country filters."
            action={{ label: 'Reset Filters', onClick: () => { setSearchQuery(''); setSelectedTopic('All'); setSelectedCountry('All'); } }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map(article => {
              const isBookmarked = bookmarkedIds.has(article.id);
              return (
                <Card key={article.id} className="flex flex-col h-full hover:border-primary-300 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="primary" className="text-xs font-semibold">{article.crop}</Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-600 font-mono">v{article.version}</Badge>
                      </div>
                      <button
                        onClick={() => toggleBookmark(article.id)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
                          isBookmarked ? 'text-primary-600' : 'text-gray-400'
                        }`}
                        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark article"}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-primary-600" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                    <CardTitle className="text-sm font-bold text-[var(--color-text-primary)] mt-1.5 leading-snug line-clamp-2">
                      {article.title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 text-[11px] text-primary-800 font-medium mt-1">
                      <Building className="w-3 h-3 text-primary-600 shrink-0" />
                      <span className="truncate">{article.source}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-2">
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 mb-3 flex-1">
                      {article.content}
                    </p>
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 text-[11px] text-gray-600 mb-3 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Country: <strong>{article.country}</strong></span>
                        <span className="text-emerald-700 font-semibold">Approved</span>
                      </div>
                      <div className="truncate text-gray-500">Ref: {article.provenance?.doiOrRef}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => setSelectedArticle(article)}
                      icon={BookOpen}
                    >
                      Read Technical Protocol
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      <Modal
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Knowledge Record'}
        size="lg"
      >
        {selectedArticle && (
          <div className="space-y-4 text-xs text-gray-700">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)] flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="primary">{selectedArticle.crop}</Badge>
                <Badge variant="outline">v{selectedArticle.version}</Badge>
                <Badge variant="success">Approved by Review Board</Badge>
              </div>
              <span className="text-xs text-gray-500 font-mono">{selectedArticle.id}</span>
            </div>

            <div className="p-3 bg-primary-50 rounded-xl border border-primary-200 text-primary-950 space-y-1">
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary-600" /> Provenance &amp; Peer Review
              </h4>
              <p className="text-[11px] leading-relaxed">
                <strong>Publishing Body:</strong> {selectedArticle.source} ({selectedArticle.country})<br />
                <strong>Reference Citation:</strong> {selectedArticle.provenance?.doiOrRef}<br />
                <strong>Effective Validity:</strong> {selectedArticle.effectiveFrom} to {selectedArticle.effectiveTo || 'Indefinite'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-gray-900">Agronomic Specification &amp; Guidance</h4>
              <p className="leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap">
                {selectedArticle.content}
              </p>
            </div>

            {selectedArticle.versionHistory && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-700">Immutable Version History</h4>
                <div className="space-y-1">
                  {selectedArticle.versionHistory.map((v, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded">
                      <span>v{v.version} — {v.changeLog}</span>
                      <span className="font-mono">{v.publishedAt.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleBookmark(selectedArticle.id)}
                icon={bookmarkedIds.has(selectedArticle.id) ? BookmarkCheck : Bookmark}
              >
                {bookmarkedIds.has(selectedArticle.id) ? 'Bookmarked' : 'Bookmark Protocol'}
              </Button>
              <Button size="sm" onClick={() => setSelectedArticle(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
