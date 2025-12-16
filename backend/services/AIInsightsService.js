/**
 * AI Insights Service
 * (temp) testing patch ability
 */

import { getDb } from '../models/db.js';

class AIInsightsService {
	constructor() {
		this.openaiApiKey = process.env.OPENAI_API_KEY;
		this.openaiModel = process.env.OPENAI_MODEL || 'gpt-5.1-codex-preview';
		this.useExternalAI = !!this.openaiApiKey;
	}

	async generateInsights(tenantId, branchId = null) {
		const insights = [];

		try {
			const inventoryInsights = await this.analyzeInventory(tenantId, branchId);
			const revenueInsights = await this.analyzeRevenue(tenantId, branchId);
			const customerInsights = await this.analyzeCustomers(tenantId, branchId);
			const paymentInsights = await this.analyzePayments(tenantId, branchId);
			const feedbackInsights = await this.analyzeFeedback(tenantId, branchId);
			const opportunityInsights = await this.identifyOpportunities(tenantId, branchId);

			insights.push(
				...inventoryInsights,
				...revenueInsights,
				...customerInsights,
				...paymentInsights,
				...feedbackInsights,
				...opportunityInsights
			);

			if (this.useExternalAI) {
				const enhancedInsights = await this.enhanceWithAI(insights, tenantId);
				return enhancedInsights;
			}
				export default new AIInsightsService();
			const customerGrowth = await db.all(growthQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (customerGrowth.length >= 2) {
				const currentMonth = customerGrowth[0].new_customers;
				const lastMonth = customerGrowth[1].new_customers;
				const growthRate = lastMonth > 0 
					? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1)
					: 100;

				if (growthRate > 20) {
					insights.push({
						id: `cust-growth-${Date.now()}`,
						type: 'customer-tag',
						title: 'Customer Acquisition Up',
						description: `New customer sign-ups increased by ${growthRate}% this month. Marketing efforts are paying off!`,
						confidence: 85,
						actionable: false,
						actionTaken: false,
						data: {
							currentMonth,
							lastMonth,
							growthRate: parseFloat(growthRate)
						},
						createdAt: new Date()
					});
				}
			}
		} catch (error) {
			console.error('Error analyzing customers:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async analyzePayments(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const overdueQuery = `
				SELECT 
					i.id, i.invoice_number, i.total_amount, i.due_date,
					}
				const currentMonth = monthlyRevenue[0];
				const lastMonth = monthlyRevenue[1];
				const growthRate = lastMonth.revenue > 0 
					? ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue * 100).toFixed(1)
					: 0;

				if (growthRate > 10) {
					insights.push({
						id: `rev-growth-${Date.now()}`,
						type: 'revenue-forecast',
						title: 'Strong Revenue Growth',
						description: `Revenue grew ${growthRate}% compared to last month. Keep up the momentum!`,
						confidence: 90,
						actionable: false,
						actionTaken: false,
						data: {
							currentRevenue: currentMonth.revenue,
							lastRevenue: lastMonth.revenue,
							growthRate: parseFloat(growthRate)
						},
						createdAt: new Date()
					});
				} else if (growthRate < -10) {
					insights.push({
						id: `rev-decline-${Date.now()}`,
						type: 'revenue-forecast',
						title: 'Revenue Decline Alert',
						description: `Revenue dropped ${Math.abs(growthRate)}% compared to last month. Review pricing and marketing strategies.`,
						confidence: 88,
						actionable: true,
						actionTaken: false,
						data: {
							currentRevenue: currentMonth.revenue,
							lastRevenue: lastMonth.revenue,
							declineRate: parseFloat(growthRate)
						},
						createdAt: new Date()
					});
				}
			}

			const dayOfWeekQuery = `
				SELECT 
					CASE EXTRACT(DOW FROM created_at)::INTEGER
						WHEN 0 THEN 'Sunday'
						WHEN 1 THEN 'Monday'
						WHEN 2 THEN 'Tuesday'
						WHEN 3 THEN 'Wednesday'
						WHEN 4 THEN 'Thursday'
						WHEN 5 THEN 'Friday'
						WHEN 6 THEN 'Saturday'
					END as day_name,
					COUNT(*) as order_count,
					SUM(total_amount) as revenue
				FROM invoices
			WHERE tenant_id = ? 
				${branchId ? 'AND branch_id = ?' : ''}
				AND status = 'paid'
				AND created_at >= NOW() - INTERVAL '30 days'
			GROUP BY day_name
				ORDER BY revenue DESC
				LIMIT 1
			`;

			const bestDay = await db.get(dayOfWeekQuery, branchId ? [tenantId, branchId] : [tenantId]);

			if (bestDay && bestDay.revenue) {
				insights.push({
					id: `rev-bestday-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Peak Sales Day Identified',
					description: `${bestDay.day_name} is your best-performing day with ₹${bestDay.revenue.toLocaleString()} in sales. Consider running promotions on slower days.`,
					confidence: 85,
					actionable: true,
					actionTaken: false,
					data: {
						bestDay: bestDay.day_name,
						revenue: bestDay.revenue,
						orderCount: bestDay.order_count
					},
					createdAt: new Date()
				});
			}
		} catch (error) {
			console.error('Error analyzing revenue:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async analyzeCustomers(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const vipQuery = `
				SELECT 
					c.id, c.name, c.email, c.phone,
					COUNT(i.id) as order_count,
					SUM(i.total_amount) as total_spent
				FROM customers c
				LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'paid'
				WHERE c.tenant_id = ?
					${branchId ? 'AND c.branch_id = ?' : ''}
				GROUP BY c.id
				HAVING total_spent > 0
				ORDER BY total_spent DESC
				LIMIT 5
			`;

			const vipCustomers = await db.all(vipQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (vipCustomers.length > 0) {
				const topCustomer = vipCustomers[0];
				insights.push({
					id: `cust-vip-${Date.now()}`,
					type: 'customer-tag',
					title: 'VIP Customer Identified',
					description: `${topCustomer.name} is your top customer with ₹${topCustomer.total_spent.toLocaleString()} in purchases. Consider offering loyalty rewards.`,
					confidence: 92,
					actionable: true,
					actionTaken: false,
					data: {
						customerName: topCustomer.name,
						totalSpent: topCustomer.total_spent,
						orderCount: topCustomer.order_count
					},
					createdAt: new Date()
				});
			}

			const inactiveQuery = `
				SELECT 
					c.id, c.name, c.email,
					MAX(i.created_at) as last_order
				FROM customers c
				LEFT JOIN invoices i ON c.id = i.customer_id
				WHERE c.tenant_id = ?
					${branchId ? 'AND c.branch_id = ?' : ''}
				GROUP BY c.id
				HAVING last_order < NOW() - INTERVAL '60 days' OR last_order IS NULL
			`;

			const inactiveCustomers = await db.all(inactiveQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (inactiveCustomers.length > 0) {
				insights.push({
					id: `cust-inactive-${Date.now()}`,
					type: 'customer-tag',
					title: 'Inactive Customers Need Attention',
					description: `${inactiveCustomers.length} customer(s) haven't ordered in 60+ days. Send re-engagement campaigns.`,
					confidence: 78,
					actionable: true,
					actionTaken: false,
					data: {
						inactiveCount: inactiveCustomers.length,
						customers: inactiveCustomers.slice(0, 5).map(c => c.name)
					},
					createdAt: new Date()
				});
			}

			const growthQuery = `
				SELECT 
					TO_CHAR(created_at, 'YYYY-MM') as month,
					COUNT(*) as new_customers
				FROM customers
				WHERE tenant_id = ?
					${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '60 days'
				GROUP BY month
				ORDER BY month DESC
				LIMIT 2
			`;

			const customerGrowth = await db.all(growthQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (customerGrowth.length >= 2) {
				const currentMonth = customerGrowth[0].new_customers;
				const lastMonth = customerGrowth[1].new_customers;
				const growthRate = lastMonth > 0 
					? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1)
					: 100;

				if (growthRate > 20) {
					insights.push({
						id: `cust-growth-${Date.now()}`,
						type: 'customer-tag',
						title: 'Customer Acquisition Up',
						description: `New customer sign-ups increased by ${growthRate}% this month. Marketing efforts are paying off!`,
						confidence: 85,
						actionable: false,
						actionTaken: false,
						data: {
							currentMonth,
							lastMonth,
							growthRate: parseFloat(growthRate)
						},
						createdAt: new Date()
					});
				}
			}
		} catch (error) {
			console.error('Error analyzing customers:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async analyzePayments(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const overdueQuery = `
				SELECT 
					i.id, i.invoice_number, i.total_amount, i.due_date,
					c.name as customer_name,
					CAST(EXTRACT(EPOCH FROM (NOW() - i.due_date)) / 86400.0 AS INTEGER) as days_overdue
				FROM invoices i
				LEFT JOIN customers c ON i.customer_id = c.id
				WHERE i.tenant_id = ?
					${branchId ? 'AND i.branch_id = ?' : ''}
					AND i.status IN ('draft', 'partial')
					AND i.due_date < CURRENT_DATE
				ORDER BY days_overdue DESC
			`;

			const overdueInvoices = await db.all(overdueQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (overdueInvoices.length > 0) {
				const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.total_amount, 0);
				const avgDaysOverdue = Math.round(overdueInvoices.reduce((sum, i) => sum + i.days_overdue, 0) / overdueInvoices.length);

				insights.push({
					id: `pay-overdue-${Date.now()}`,
					type: 'payment-delay',
					title: 'Overdue Payments Require Action',
					description: `${overdueInvoices.length} invoice(s) totaling ₹${totalOverdue.toLocaleString()} are overdue by an average of ${avgDaysOverdue} days.`,
					confidence: 95,
					actionable: true,
					actionTaken: false,
					data: {
						overdueCount: overdueInvoices.length,
						totalAmount: totalOverdue,
						avgDaysOverdue,
						topOverdue: overdueInvoices.slice(0, 3).map(i => ({
							invoiceNumber: i.invoice_number,
							customer: i.customer_name,
							amount: i.total_amount,
							daysOverdue: Math.round(i.days_overdue)
						}))
					},
					createdAt: new Date()
				});
			}

			const paymentMethodQuery = `
				SELECT 
					payment_method,
					COUNT(*) as count,
					SUM(total_amount) as total
				FROM invoices
			WHERE tenant_id = ?
				${branchId ? 'AND branch_id = ?' : ''}
				AND status = 'paid'
				AND created_at >= NOW() - INTERVAL '30 days'
			GROUP BY payment_method
				ORDER BY count DESC
			`;

			const paymentMethods = await db.all(paymentMethodQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (paymentMethods.length > 0) {
				const topMethod = paymentMethods[0];
				const total = paymentMethods.reduce((sum, p) => sum + p.count, 0);
				const percentage = ((topMethod.count / total) * 100).toFixed(0);

				insights.push({
					id: `pay-method-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Payment Preference Insight',
					description: `${percentage}% of customers prefer ${topMethod.payment_method || 'cash'}. Consider incentives for digital payments.`,
					confidence: 80,
					actionable: true,
					actionTaken: false,
					data: {
						preferredMethod: topMethod.payment_method || 'cash',
						percentage: parseInt(percentage),
						methods: paymentMethods
					},
					createdAt: new Date()
				});
			}
		} catch (error) {
			console.error('Error analyzing payments:', error);
		} finally {
			await db.close();
		}

		return insights;
