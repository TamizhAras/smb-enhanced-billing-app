import { useState, useEffect } from 'react';
import { useAIStore } from '../store/useAIStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Star,
  Package,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';

export default function AIInsightsPage() {
  const { insights, loading, fetchInsights, markInsightAsActioned } = useAIStore();
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'inventory-optimization': return <Package className="h-5 w-5 text-blue-500" />;
      case 'customer-tag': return <Users className="h-5 w-5 text-green-500" />;
      case 'revenue-forecast': return <DollarSign className="h-5 w-5 text-purple-500" />;
      case 'task-optimization': return <Target className="h-5 w-5 text-orange-500" />;
      case 'marketing-suggestion': return <TrendingUp className="h-5 w-5 text-pink-500" />;
      default: return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  const filteredInsights = selectedType === 'all' 
    ? insights 
    : insights.filter(insight => insight.type === selectedType);

  const insightTypes = [
    { value: 'all', label: 'All Insights', count: insights.length },
    { value: 'inventory-optimization', label: 'Inventory', count: insights.filter(i => i.type === 'inventory-optimization').length },
    { value: 'customer-tag', label: 'Customers', count: insights.filter(i => i.type === 'customer-tag').length },
    { value: 'revenue-forecast', label: 'Revenue', count: insights.filter(i => i.type === 'revenue-forecast').length },
    { value: 'task-optimization', label: 'Tasks', count: insights.filter(i => i.type === 'task-optimization').length },
    { value: 'marketing-suggestion', label: 'Marketing', count: insights.filter(i => i.type === 'marketing-suggestion').length }
  ];

  const actionableInsights = insights.filter(i => i.actionable && !i.actionTaken);
  const completedInsights = insights.filter(i => i.actionTaken);
  const avgConfidence = insights.length > 0 
    ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
    : 0;

  const handleRefresh = () => {
    fetchInsights();
    // In a real app, this would trigger AI analysis
    console.log('Refreshing AI insights...');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Business Insights
          </h1>
          <p className="text-gray-600">Smart recommendations and business intelligence</p>
        </div>
        <Button 
          onClick={handleRefresh}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
            </div>
            <Zap className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Action Needed</p>
              <p className="text-2xl font-bold text-orange-600">{actionableInsights.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedInsights.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-600">{avgConfidence}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {insightTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedType === type.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label} {type.count > 0 && <span className="ml-1">({type.count})</span>}
          </button>
        ))}
      </div>

      {/* Urgent Actions */}
      {actionableInsights.length > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Action Required ({actionableInsights.length})
          </h2>
          <div className="space-y-3">
            {actionableInsights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}`}>
                          {getConfidenceLabel(insight.confidence)} ({insight.confidence}%)
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(insight.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => markInsightAsActioned(insight.id)}
                  >
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Insights */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedType === 'all' ? 'All Insights' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Insights`}
          ({filteredInsights.length})
        </h2>
        
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No insights available. AI is analyzing your business data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <div key={insight.id} className={`border rounded-lg p-4 ${
                insight.actionTaken ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        {insight.actionTaken && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      
                      {/* Additional Data */}
                      {insight.data && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Supporting Data:</p>
                          <div className="text-sm text-gray-700">
                            {insight.type === 'inventory-optimization' && insight.data.outOfStock && (
                              <div>
                                <span className="font-medium">Out of Stock:</span> {insight.data.outOfStock.join(', ')}
                              </div>
                            )}
                            {insight.type === 'customer-tag' && insight.data.totalSpent && (
                              <div>
                                <span className="font-medium">Total Spent:</span> ₹{insight.data.totalSpent.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(insight.confidence)}`}>
                          {getConfidenceLabel(insight.confidence)} Confidence ({insight.confidence}%)
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(insight.createdAt)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                          insight.type === 'inventory-optimization' ? 'bg-blue-100 text-blue-700' :
                          insight.type === 'customer-tag' ? 'bg-green-100 text-green-700' :
                          insight.type === 'revenue-forecast' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {insight.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {insight.actionable && !insight.actionTaken && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => markInsightAsActioned(insight.id)}
                    >
                      Mark as Done
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Performance */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          AI Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{avgConfidence}%</div>
            <div className="text-sm text-gray-600">Average Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{completedInsights.length}</div>
            <div className="text-sm text-gray-600">Actions Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {insights.length > 0 ? Math.round((completedInsights.length / insights.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Implementation Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
