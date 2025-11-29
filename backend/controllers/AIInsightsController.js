/**
 * AI Insights Controller
 * Handles API endpoints for AI-powered business insights
 */

import express from 'express';
import AIInsightsService from '../services/AIInsightsService.new.js';
import { authenticateToken, requireTenantAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all insights for the authenticated tenant
 * GET /api/insights
 */
router.get('/', authenticateToken, requireTenantAccess, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branchId = req.query.branch_id || req.user.branchId;

    const insights = await AIInsightsService.generateInsights(tenantId, branchId);

    res.json({
      success: true,
      data: insights,
      meta: {
        total: insights.length,
        actionable: insights.filter(i => i.actionable && !i.actionTaken).length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

/**
 * Get insight statistics
 * GET /api/insights/stats
 */
router.get('/stats', authenticateToken, requireTenantAccess, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branchId = req.query.branch_id || req.user.branchId;

    const insights = await AIInsightsService.generateInsights(tenantId, branchId);

    const stats = {
      total: insights.length,
      byType: {},
      actionable: insights.filter(i => i.actionable && !i.actionTaken).length,
      completed: insights.filter(i => i.actionTaken).length,
      avgConfidence: insights.length > 0 
        ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)
        : 0
    };

    // Count by type
    insights.forEach(insight => {
      stats.byType[insight.type] = (stats.byType[insight.type] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching insight stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * Refresh insights (force regeneration)
 * POST /api/insights/refresh
 */
router.post('/refresh', authenticateToken, requireTenantAccess, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branchId = req.query.branch_id || req.user.branchId;

    // Generate fresh insights
    const insights = await AIInsightsService.generateInsights(tenantId, branchId);

    res.json({
      success: true,
      data: insights,
      meta: {
        total: insights.length,
        refreshedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error refreshing insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh insights'
    });
  }
});

/**
 * Mark an insight as actioned
 * POST /api/insights/:id/action
 */
router.post('/:id/action', authenticateToken, requireTenantAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you'd store this in the database
    // For now, we'll just acknowledge the action
    res.json({
      success: true,
      message: 'Insight marked as actioned',
      insightId: id
    });
  } catch (error) {
    console.error('Error marking insight as actioned:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update insight'
    });
  }
});

export default router;
