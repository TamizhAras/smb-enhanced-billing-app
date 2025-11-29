import { useState, useEffect } from 'react';
import { useAIStore } from '../store/useAIStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { 
  Brain, TrendingUp, AlertTriangle, CheckCircle, Clock, Star, Package, Users,
  DollarSign, Target, Lightbulb, RefreshCw, Sparkles, Rocket, Shield, Activity,
  CheckCircle2, Timer, Flame, Search, ShoppingCart, UserCheck, LineChart,
  ShieldAlert, Briefcase, FileText, ChevronDown, ChevronUp, ExternalLink, Info, Zap
} from 'lucide-react';

export default function AIInsightsPage() {
  const { insights, loading, fetchInsights, markInsightAsActioned } = useAIStore();
  const { selectedBranchId, user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedInsights, setExpandedInsights] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, selectedBranchId]);

  const toggleInsightExpansion = (id: string | number) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedInsights(newExpanded);
  };

  // Get icon for insight type
  const getInsightIcon = (type: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'inventory-optimization': <Package className="h-5 w-5" />,
      'customer-tag': <Users className="h-5 w-5" />,
      'revenue-forecast': <TrendingUp className="h-5 w-5" />,
      'payment-delay': <Clock className="h-5 w-5" />,
      'feedback-pattern': <Star className="h-5 w-5" />,
      'business-opportunity': <Rocket className="h-5 w-5" />,
      'financial-risk': <DollarSign className="h-5 w-5" />,
      'sales-intelligence': <ShoppingCart className="h-5 w-5" />,
      'customer-analytics': <UserCheck className="h-5 w-5" />,
      'predictive-analytics': <LineChart className="h-5 w-5" />,
      'fraud-detection': <ShieldAlert className="h-5 w-5" />,
      'staff-operations': <Briefcase className="h-5 w-5" />,
      'executive-summary': <FileText className="h-5 w-5" />,
      'ai-summary': <Brain className="h-5 w-5" />
    };
    return iconMap[type] || <Lightbulb className="h-5 w-5" />;
  };

  // Get colors for insight type
  const getInsightColor = (type: string) => {
    const colorMap: Record<string, any> = {
      'inventory-optimization': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badgeBg: 'bg-blue-100', iconBg: 'bg-blue-500' },
      'customer-tag': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badgeBg: 'bg-green-100', iconBg: 'bg-green-500' },
      'revenue-forecast': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badgeBg: 'bg-purple-100', iconBg: 'bg-purple-500' },
      'payment-delay': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badgeBg: 'bg-red-100', iconBg: 'bg-red-500' },
      'feedback-pattern': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badgeBg: 'bg-yellow-100', iconBg: 'bg-yellow-500' },
      'business-opportunity': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badgeBg: 'bg-indigo-100', iconBg: 'bg-indigo-500' },
      'financial-risk': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badgeBg: 'bg-rose-100', iconBg: 'bg-rose-500' },
      'sales-intelligence': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badgeBg: 'bg-cyan-100', iconBg: 'bg-cyan-500' },
      'customer-analytics': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badgeBg: 'bg-teal-100', iconBg: 'bg-teal-500' },
      'predictive-analytics': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badgeBg: 'bg-violet-100', iconBg: 'bg-violet-500' },
      'fraud-detection': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badgeBg: 'bg-amber-100', iconBg: 'bg-amber-500' },
      'staff-operations': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badgeBg: 'bg-slate-100', iconBg: 'bg-slate-500' },
      'executive-summary': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badgeBg: 'bg-sky-100', iconBg: 'bg-sky-500' },
      'ai-summary': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', badgeBg: 'bg-fuchsia-100', iconBg: 'bg-fuchsia-500' }
    };
    return colorMap[type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badgeBg: 'bg-gray-100', iconBg: 'bg-gray-500' };
  };

  // Insight categories
  const categories = [
    { id: 'all', name: 'All Insights', icon: <Sparkles className="h-4 w-4" />, types: [] },
    { id: 'financial', name: 'Financial', icon: <DollarSign className="h-4 w-4" />, types: ['financial-risk', 'payment-delay', 'revenue-forecast'] },
    { id: 'sales', name: 'Sales', icon: <ShoppingCart className="h-4 w-4" />, types: ['sales-intelligence', 'business-opportunity'] },
    { id: 'customer', name: 'Customers', icon: <Users className="h-4 w-4" />, types: ['customer-tag', 'customer-analytics', 'feedback-pattern'] },
    { id: 'inventory', name: 'Inventory', icon: <Package className="h-4 w-4" />, types: ['inventory-optimization'] },
    { id: 'operations', name: 'Operations', icon: <Briefcase className="h-4 w-4" />, types: ['staff-operations', 'task-optimization'] },
    { id: 'predictive', name: 'Predictive', icon: <LineChart className="h-4 w-4" />, types: ['predictive-analytics', 'fraud-detection'] },
    { id: 'executive', name: 'Executive', icon: <FileText className="h-4 w-4" />, types: ['executive-summary', 'ai-summary'] }
  ];

  // Filter insights
  const filteredInsights = insights
    .filter(insight => {
      if (selectedCategory === 'all') return true;
      const category = categories.find(cat => cat.id === selectedCategory);
      return category ? category.types.includes(insight.type) : false;
    })
    .filter(insight => 
      searchQuery === '' || 
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Stats
  const actionableInsights = insights.filter(i => i.actionable && !i.actionTaken);
  const completedInsights = insights.filter(i => i.actionTaken);
  const highConfidenceInsights = insights.filter(i => i.confidence >= 90);
  const avgConfidence = insights.length > 0 
    ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
    : 0;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  };

  const renderInsightData = (insight: any) => {
    const data = insight.data;
    if (!data) return null;

    const colors = getInsightColor(insight.type);

    return (
      <div className={`mt-3 p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Details</span>
        </div>
        
        <div className="space-y-2 text-sm">
          {/* Financial Risk Data */}
          {data.total_inflow && (
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-gray-600">Total Inflow:</span> <span className="font-semibold">₹{data.total_inflow.toLocaleString()}</span></div>
              <div><span className="text-gray-600">Pending:</span> <span className="font-semibold text-amber-600">₹{data.pending_amount?.toLocaleString()}</span></div>
            </div>
          )}

          {/* Sales Data */}
          {data.bestSellers && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Top Products:</div>
              <div className="space-y-1">
                {data.bestSellers.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.item_name}</span>
                    <span className="font-medium">{item.units_sold} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Data */}
          {data.topCustomers && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">High-Value Customers:</div>
              <div className="space-y-1">
                {data.topCustomers.slice(0, 3).map((customer: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{customer.name}</span>
                    <span className="font-medium">₹{customer.lifetime_value?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Data */}
          {data.items && Array.isArray(data.items) && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Items ({data.items.length}):</div>
              <div className="flex flex-wrap gap-1">
                {data.items.slice(0, 5).map((item: any, idx: number) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full ${colors.badgeBg} ${colors.text}`}>
                    {typeof item === 'string' ? item : item.name}
                  </span>
                ))}
                {data.items.length > 5 && (
                  <span className="text-xs px-2 py-1 text-gray-500">+{data.items.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          {/* Generic Data */}
          {data.count && <div><span className="text-gray-600">Count:</span> <span className="font-semibold">{data.count}</span></div>}
          {data.total_customers && <div><span className="text-gray-600">Customers:</span> <span className="font-semibold">{data.total_customers}</span></div>}
          {data.total_products && <div><span className="text-gray-600">Products:</span> <span className="font-semibold">{data.total_products}</span></div>}
          {data.lifetime_revenue !== undefined && <div><span className="text-gray-600">Lifetime Revenue:</span> <span className="font-semibold">₹{(data.lifetime_revenue || 0).toLocaleString()}</span></div>}
        </div>
      </div>
    );
  };

  if (loading && insights.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-32 bg-white rounded-2xl"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-xl"></div>)}
          </div>
          <div className="h-96 bg-white rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  AI Business Insights
                  <Zap className="h-6 w-6 text-yellow-500 fill-current" />
                </h1>
                <p className="text-sm text-gray-600 mt-1">Powered by advanced analytics and machine learning</p>
              </div>
            </div>
            <Button 
              onClick={() => fetchInsights()} 
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Insights
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{insights.length}</span>
            </div>
            <div className="text-sm text-gray-600">Total Insights</div>
            <div className="mt-2 text-xs text-gray-500">{highConfidenceInsights.length} high confidence</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{actionableInsights.length}</span>
            </div>
            <div className="text-sm text-gray-600">Action Required</div>
            <div className="mt-2 text-xs text-gray-500">Pending attention</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-600">{completedInsights.length}</span>
            </div>
            <div className="text-sm text-gray-600">Completed</div>
            <div className="mt-2 text-xs text-gray-500">Actions taken</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">{avgConfidence}%</span>
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
            <div className="mt-2 text-xs text-gray-500">AI accuracy score</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = cat.id === 'all' 
                  ? insights.length 
                  : insights.filter(i => cat.types.includes(i.type)).length;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.name}</span>
                    {count > 0 && (
                      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full font-semibold ${
                        selectedCategory === cat.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Critical Actions Banner */}
        {actionableInsights.filter(i => i.confidence >= 90).length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Flame className="h-5 w-5 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-1">Critical Actions Required</h3>
                <p className="text-sm text-red-700">
                  {actionableInsights.filter(i => i.confidence >= 90).length} high-priority insights need immediate attention
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insights List */}
        <div className="space-y-3">
          {filteredInsights.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights found</h3>
              <p className="text-gray-600">Try adjusting your filters or refresh to generate new insights</p>
            </div>
          ) : (
            filteredInsights.map((insight) => {
              const colors = getInsightColor(insight.type);
              const isExpanded = expandedInsights.has(insight.id);
              const hasDetailedData = insight.data && Object.keys(insight.data).length > 0;

              return (
                <div 
                  key={insight.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                    insight.actionTaken 
                      ? 'border-green-300 bg-green-50/30' 
                      : insight.actionable && insight.confidence >= 90
                        ? 'border-red-200 bg-red-50/20'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 ${colors.iconBg} rounded-xl text-white shrink-0 shadow-md`}>
                        {getInsightIcon(insight.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{insight.title}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors.badgeBg} ${colors.text}`}>
                                {insight.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                insight.confidence >= 90 ? 'bg-green-100 text-green-700' :
                                insight.confidence >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {insight.confidence}% confidence
                              </span>
                              {insight.actionable && !insight.actionTaken && (
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  insight.confidence >= 90 ? 'bg-red-500 text-white animate-pulse' :
                                  'bg-amber-500 text-white'
                                }`}>
                                  {insight.confidence >= 90 ? 'Critical' : 'Action Needed'}
                                </span>
                              )}
                              {insight.actionTaken && (
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500 text-white flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">{insight.description}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {formatTimeAgo(insight.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasDetailedData && (
                              <button
                                onClick={() => toggleInsightExpansion(insight.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    View Details
                                  </>
                                )}
                              </button>
                            )}
                            {insight.actionable && !insight.actionTaken && (
                              <button
                                onClick={() => markInsightAsActioned(insight.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg shadow-sm transition-all"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark as Done
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && hasDetailedData && renderInsightData(insight)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{insights.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Insights</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{completedInsights.length}</div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{actionableInsights.length}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{avgConfidence}%</div>
              <div className="text-sm text-gray-600 mt-1">Avg Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
