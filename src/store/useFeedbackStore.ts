import { create } from 'zustand';
import { db } from '../lib/database';
import type { Feedback } from '../lib/database';

interface FeedbackStore {
  feedback: Feedback[]; // Changed from feedbacks to feedback
  feedbacks: Feedback[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadFeedback: () => Promise<void>; // Added loadFeedback alias
  loadFeedbacks: () => Promise<void>;
  addFeedback: (feedbackData: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  updateFeedback: (id: number, updates: Partial<Feedback>) => Promise<void>;
  deleteFeedback: (id: number) => Promise<void>;
  
  // WhatsApp Integration
  generateFeedbackMessage: (customerName: string, invoiceNumber: string) => string;
  sendWhatsAppFeedback: (phone: string, message: string) => void;
  
  // Analytics
  getFeedbackStats: () => { happy: number; neutral: number; sad: number }; // Added getFeedbackStats
  getAverageRating: () => number;
  getSentimentDistribution: () => { happy: number; neutral: number; sad: number };
  getResponseRate: () => number;
  getRecentFeedback: (days?: number) => Feedback[];
}

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  feedback: [], // Added feedback alias
  feedbacks: [],
  isLoading: false,
  error: null,

  loadFeedback: async () => { // Added loadFeedback alias
    set({ isLoading: true, error: null });
    try {
      const feedbacks = await db.feedbacks.orderBy('feedbackDate').reverse().toArray();
      set({ feedback: feedbacks, feedbacks, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load feedbacks', isLoading: false });
    }
  },

  loadFeedbacks: async () => {
    set({ isLoading: true, error: null });
    try {
      const feedbacks = await db.feedbacks.orderBy('feedbackDate').reverse().toArray();
      set({ feedback: feedbacks, feedbacks, isLoading: false }); // Update both properties
    } catch (error) {
      set({ error: 'Failed to load feedbacks', isLoading: false });
    }
  },

  addFeedback: async (feedbackData) => {
    set({ isLoading: true, error: null });
    try {
      await db.feedbacks.add({
        ...feedbackData,
        createdAt: new Date()
      });
      await get().loadFeedbacks();
    } catch (error) {
      set({ error: 'Failed to add feedback', isLoading: false });
    }
  },

  updateFeedback: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.feedbacks.update(id, updates);
      await get().loadFeedbacks();
    } catch (error) {
      set({ error: 'Failed to update feedback', isLoading: false });
    }
  },

  deleteFeedback: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.feedbacks.delete(id);
      await get().loadFeedbacks();
    } catch (error) {
      set({ error: 'Failed to delete feedback', isLoading: false });
    }
  },

  generateFeedbackMessage: (customerName, invoiceNumber) => {
    return `Hi ${customerName}! 👋

Thank you for your recent purchase (Invoice: ${invoiceNumber}). We hope you're satisfied with our products/services.

We'd love to hear your feedback! Please rate your experience:
⭐⭐⭐⭐⭐ Excellent
⭐⭐⭐⭐ Good  
⭐⭐⭐ Average
⭐⭐ Poor
⭐ Very Poor

Feel free to share any comments or suggestions. Your feedback helps us serve you better!

Best regards,
Your SMB Team`;
  },

  sendWhatsAppFeedback: (phone, message) => {
    // Clean phone number
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    
    // Create WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  },

  getAverageRating: () => {
    const feedbacks = get().feedbacks;
    if (feedbacks.length === 0) return 0;
    
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    return totalRating / feedbacks.length;
  },

  getSentimentDistribution: () => {
    const feedbacks = get().feedbacks;
    return feedbacks.reduce((acc, feedback) => {
      acc[feedback.sentiment]++;
      return acc;
    }, { happy: 0, neutral: 0, sad: 0 });
  },

  getFeedbackStats: () => {
    const feedbacks = get().feedbacks;
    return feedbacks.reduce((acc, feedback) => {
      acc[feedback.sentiment]++;
      return acc;
    }, { happy: 0, neutral: 0, sad: 0 });
  },

  getResponseRate: () => {
    // This would need to be calculated against total paid invoices
    // For now, return a simple calculation
    const feedbacks = get().feedbacks;
    const respondedFeedbacks = feedbacks.filter(f => f.responded);
    
    if (feedbacks.length === 0) return 0;
    return (respondedFeedbacks.length / feedbacks.length) * 100;
  },

  getRecentFeedback: (days = 7) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return get().feedbacks.filter(feedback => 
      new Date(feedback.feedbackDate) >= cutoffDate
    );
  }
}));
