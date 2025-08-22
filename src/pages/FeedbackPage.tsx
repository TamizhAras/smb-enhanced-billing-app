import { useState, useEffect } from 'react';
import { useFeedbackStore } from '../store/useFeedbackStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Star, 
  Smile, 
  Meh, 
  Frown,
  Phone,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { 
    feedback, 
    isLoading, 
    loadFeedback, 
    addFeedback,
    updateFeedback,
    getFeedbackStats 
  } = useFeedbackStore();
  
  const { customers, loadCustomers } = useCustomerStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    customerId: 1,
    customerName: '',
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    sentiment: 'positive' as const,
    comment: '',
    responseMethod: 'whatsapp' as const,
    tags: []
  });

  useEffect(() => {
    loadFeedback();
    loadCustomers();
  }, [loadFeedback, loadCustomers]);

  const handleAddFeedback = async () => {
    if (!newFeedback.customerName.trim()) return;
    
    await addFeedback({
      ...newFeedback,
      feedbackDate: new Date(),
      responded: false
    });
    
    setNewFeedback({
      customerId: 1,
      customerName: '',
      rating: 5 as 1 | 2 | 3 | 4 | 5,
      sentiment: 'positive',
      comment: '',
      responseMethod: 'whatsapp',
      tags: []
    });
    setIsAddingFeedback(false);
  };

  const handleMarkAsResponded = async (id: number) => {
    const feedbackItem = feedback.find(f => f.id === id);
    if (feedbackItem) {
      await updateFeedback(id, { ...feedbackItem, responded: true });
    }
  };

  const filteredFeedback = feedback.filter(fb => {
    const matchesSearch = fb.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fb.customerName?.includes(searchTerm) ||
                         fb.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSentiment = selectedSentiment === 'all' || fb.sentiment === selectedSentiment;
    const matchesRating = selectedRating === 'all' || fb.rating.toString() === selectedRating;
    
    return matchesSearch && matchesSentiment && matchesRating;
  });

  const stats = getFeedbackStats();
  const pendingResponses = feedback.filter(f => !f.responded).length;
  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0.0';

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'happy': return <Smile className="h-4 w-4 text-green-500" />;
      case 'neutral': return <Meh className="h-4 w-4 text-yellow-500" />;
      case 'sad': return <Frown className="h-4 w-4 text-red-500" />;
      default: return <Meh className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'happy': return 'bg-green-100 text-green-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      case 'sad': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-gray-600">Collect and analyze customer feedback for better service</p>
        </div>
        <Button 
          onClick={() => setIsAddingFeedback(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Feedback
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{feedback.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-yellow-600">{averageRating}/5</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Responses</p>
              <p className="text-2xl font-bold text-orange-600">{pendingResponses}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Happy Customers</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(((stats.happy || 0) / Math.max(feedback.length, 1)) * 100)}%
              </p>
            </div>
            <Smile className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Sentiment Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Smile className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-semibold text-green-900">Happy</p>
                <p className="text-sm text-green-600">{stats.happy || 0} customers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {Math.round(((stats.happy || 0) / Math.max(feedback.length, 1)) * 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Meh className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-semibold text-yellow-900">Neutral</p>
                <p className="text-sm text-yellow-600">{stats.neutral || 0} customers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600">
                {Math.round(((stats.neutral || 0) / Math.max(feedback.length, 1)) * 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Frown className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-semibold text-red-900">Unhappy</p>
                <p className="text-sm text-red-600">{stats.sad || 0} customers</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">
                {Math.round(((stats.sad || 0) / Math.max(feedback.length, 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search feedback by customer name, phone, or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Sentiments</option>
                <option value="happy">Happy</option>
                <option value="neutral">Neutral</option>
                <option value="sad">Unhappy</option>
              </select>
            </div>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Pending Responses */}
      {pendingResponses > 0 && (
        <Card className="p-6 border-orange-200 bg-orange-50">
          <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Pending Responses ({pendingResponses})
          </h2>
          <div className="space-y-3">
            {feedback.filter(f => !f.responded).slice(0, 3).map((fb) => (
              <div key={fb.id} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{fb.customerName}</h3>
                      {renderStars(fb.rating)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(fb.sentiment)}`}>
                        {fb.sentiment}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-gray-600 text-sm mb-2">"{fb.comment}"</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(fb.feedbackDate)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => handleMarkAsResponded(fb.id!)}
                  >
                    Mark Responded
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Feedback */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          All Feedback ({filteredFeedback.length})
        </h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading feedback...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || selectedSentiment !== 'all' || selectedRating !== 'all' 
                ? 'No feedback matches your search criteria' 
                : 'No feedback yet. Add your first feedback!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((fb) => (
              <div key={fb.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{fb.customerName}</h3>
                      {renderStars(fb.rating)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getSentimentColor(fb.sentiment)}`}>
                        {getSentimentIcon(fb.sentiment)}
                        <span className="ml-1 capitalize">{fb.sentiment}</span>
                      </span>
                      {fb.responded && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Responded
                        </span>
                      )}
                    </div>
                    
                    {fb.comment && (
                      <p className="text-gray-700 mb-3 italic">"{fb.comment}"</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(fb.feedbackDate)}
                      </div>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded capitalize">
                        {fb.responseMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {!fb.responded && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMarkAsResponded(fb.id!)}
                    >
                      Mark Responded
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Feedback Modal */}
      {isAddingFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Customer Feedback</h3>
            <div className="space-y-4">
              <Input
                label="Customer Name *"
                value={newFeedback.customerName}
                onChange={(e) => setNewFeedback({...newFeedback, customerName: e.target.value})}
                placeholder="Enter customer name"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5] as const).map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewFeedback({...newFeedback, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= newFeedback.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({newFeedback.rating}/5)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment</label>
                <select
                  value={newFeedback.sentiment}
                  onChange={(e) => setNewFeedback({...newFeedback, sentiment: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="happy">Happy 😊</option>
                  <option value="neutral">Neutral 😐</option>
                  <option value="sad">Unhappy 😞</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={newFeedback.comment}
                  onChange={(e) => setNewFeedback({...newFeedback, comment: e.target.value})}
                  placeholder="Customer's feedback comment..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Response Method</label>
                <select
                  value={newFeedback.responseMethod}
                  onChange={(e) => setNewFeedback({...newFeedback, responseMethod: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="manual">Manual Entry</option>
                  <option value="direct">Direct Feedback</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleAddFeedback}
                className="flex-1"
                disabled={!newFeedback.customerName.trim()}
              >
                Add Feedback
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingFeedback(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
