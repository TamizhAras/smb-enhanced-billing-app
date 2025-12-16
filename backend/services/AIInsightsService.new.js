/**
 * AI Insights Service
 * Combines rule-based analytics with optional OpenAI enhancement
 */

import fetch from 'node-fetch';
import { getDb } from '../models/db.js';

class AIInsightsService {
	constructor() {
		this.openaiApiKey = process.env.OPENAI_API_KEY;
		this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
		this.useExternalAI = Boolean(this.openaiApiKey);
	}

	async generateInsights(tenantId, branchId = null) {
		const insights = [];

		try {
			// Existing analyzers
			const inventoryInsights = await this.analyzeInventory(tenantId, branchId);
			const revenueInsights = await this.analyzeRevenue(tenantId, branchId);
			const customerInsights = await this.analyzeCustomers(tenantId, branchId);
			const paymentInsights = await this.analyzePayments(tenantId, branchId);
			const feedbackInsights = await this.analyzeFeedback(tenantId, branchId);
			const opportunityInsights = await this.identifyOpportunities(tenantId, branchId);

			// New comprehensive analyzers
			const financialRiskInsights = await this.analyzeFinancialRisk(tenantId, branchId);
			const salesIntelligenceInsights = await this.analyzeSalesIntelligence(tenantId, branchId);
			const customerAnalyticsInsights = await this.analyzeCustomerAnalytics(tenantId, branchId);
			const predictiveInsights = await this.analyzePredictive(tenantId, branchId);
			const fraudInsights = await this.analyzeFraudAndAnomalies(tenantId, branchId);
			const staffInsights = await this.analyzeStaffAndOperations(tenantId, branchId);
			const executiveInsights = await this.generateExecutiveIntelligence(tenantId, branchId);

			insights.push(
				...inventoryInsights,
				...revenueInsights,
				...customerInsights,
				...paymentInsights,
				...feedbackInsights,
				...opportunityInsights,
				...financialRiskInsights,
				...salesIntelligenceInsights,
				...customerAnalyticsInsights,
				...predictiveInsights,
				...fraudInsights,
				...staffInsights,
				...executiveInsights
			);

			if (this.useExternalAI && insights.length > 0) {
				return await this.enhanceWithAI(insights);
			}

			return insights;
		} catch (error) {
			console.error('Error generating insights:', error);
			throw error;
		}
	}

	async analyzeInventory(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			let query = `
				SELECT 
					id, name, quantity, min_stock_level, cost_price, selling_price,
					category, branch_id
				FROM inventory
				WHERE tenant_id = ?
			`;
			const params = [tenantId];

			if (branchId) {
				query += ' AND branch_id = ?';
				params.push(branchId);
			}

			const inventory = await db.all(query, params) || [];

			const outOfStock = inventory.filter(item => item.quantity === 0);
			if (outOfStock.length) {
				insights.push({
					id: `inv-oos-${Date.now()}`,
					type: 'inventory-optimization',
					title: 'Out of Stock Alert',
					description: `${outOfStock.length} item(s) are out of stock and need restocking.`,
					confidence: 95,
					actionable: true,
					actionTaken: false,
					data: {
						items: outOfStock.map(item => ({ id: item.id, name: item.name })),
						count: outOfStock.length
					},
					createdAt: new Date()
				});
			}

			const lowStock = inventory.filter(item =>
				item.quantity > 0 &&
				item.min_stock_level &&
				item.quantity <= item.min_stock_level
			);
			if (lowStock.length) {
				insights.push({
					id: `inv-low-${Date.now()}`,
					type: 'inventory-optimization',
					title: 'Low Stock Warning',
					description: `${lowStock.length} item(s) are close to minimum stock levels.`,
					confidence: 88,
					actionable: true,
					actionTaken: false,
					data: {
						items: lowStock.map(item => ({
							name: item.name,
							quantity: item.quantity,
							minimum: item.min_stock_level
						}))
					},
					createdAt: new Date()
				});
			}

			const overStock = inventory.filter(item =>
				item.min_stock_level &&
				item.quantity > item.min_stock_level * 3
			);
			if (overStock.length) {
				const excessValue = overStock.reduce((sum, item) =>
					sum + (item.cost_price || 0) * (item.quantity - item.min_stock_level),
				0);
				insights.push({
					id: `inv-over-${Date.now()}`,
					type: 'inventory-optimization',
					title: 'Overstock Advisory',
					description: `${overStock.length} item(s) tie up ₹${excessValue.toLocaleString()} in slow capital.`,
					confidence: 75,
					actionable: true,
					actionTaken: false,
					data: {
						items: overStock.map(item => item.name),
						excessValue
					},
					createdAt: new Date()
				});
			}

			const slowMovingQuery = `
				SELECT i.id, i.name, i.quantity, i.cost_price,
					COALESCE(SUM(ii.quantity), 0) as sold_qty
				FROM inventory i
				LEFT JOIN invoice_items ii ON i.id = ii.item_id
				LEFT JOIN invoices inv ON ii.invoice_id = inv.id
					AND inv.created_at >= NOW() - INTERVAL '30 days'
				WHERE i.tenant_id = ? AND i.quantity > 0
				${branchId ? 'AND i.branch_id = ?' : ''}
				GROUP BY i.id
				HAVING sold_qty = 0
			`;

			const slowMoving = await db.all(slowMovingQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []) || [];
			if (slowMoving.length) {
				const tiedUpCapital = slowMoving.reduce((sum, item) =>
					sum + (item.cost_price || 0) * item.quantity,
				0);
				insights.push({
					id: `inv-slow-${Date.now()}`,
					type: 'inventory-optimization',
					title: 'Slow Moving Stock',
					description: `${slowMoving.length} item(s) haven't sold in 30 days.`,
					confidence: 82,
					actionable: true,
					actionTaken: false,
					data: {
						items: slowMoving.map(item => item.name),
						tiedUpCapital
					},
					createdAt: new Date()
				});
			}
		} catch (error) {
			console.error('Error analyzing inventory:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async analyzeRevenue(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const revenueQuery = `
				SELECT 
					TO_CHAR(created_at, 'YYYY-MM') as month,
					SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue,
					COUNT(*) as invoice_count
				FROM invoices
				WHERE tenant_id = ?
					${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '60 days'
				GROUP BY month
				ORDER BY month DESC
				LIMIT 2
			`;

			const monthlyRevenue = await db.all(revenueQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];

			if (monthlyRevenue.length >= 2) {
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
						description: `Revenue grew ${growthRate}% compared to last month.`,
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
						description: `Revenue dropped ${Math.abs(growthRate)}% compared to last month.`,
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

			const bestDayQuery = `
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

			const bestDay = await db.get(bestDayQuery, branchId ? [tenantId, branchId] : [tenantId]);
			if (bestDay) {
				insights.push({
					id: `rev-bestday-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Peak Sales Day Identified',
					description: `${bestDay.day_name} generated ₹${bestDay.revenue.toLocaleString()} in the last month.`,
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
			if (vipCustomers.length) {
				const topCustomer = vipCustomers[0];
				insights.push({
					id: `cust-vip-${Date.now()}`,
					type: 'customer-tag',
					title: 'VIP Customer Identified',
					description: `${topCustomer.name} spent ₹${topCustomer.total_spent.toLocaleString()} so far.`,
					confidence: 92,
					actionable: true,
					actionTaken: false,
					data: {
						customerName: topCustomer.name,
						orderCount: topCustomer.order_count,
						totalSpent: topCustomer.total_spent
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
			if (inactiveCustomers.length) {
				insights.push({
					id: `cust-inactive-${Date.now()}`,
					type: 'customer-tag',
					title: 'Inactive Customers Need Attention',
					description: `${inactiveCustomers.length} customer(s) haven't purchased in 60+ days.`,
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
						description: `New customer sign-ups increased by ${growthRate}% this month.`,
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
			if (overdueInvoices.length) {
				const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
				const avgDaysOverdue = Math.round(
					overdueInvoices.reduce((sum, invoice) => sum + invoice.days_overdue, 0) / overdueInvoices.length
				);

				insights.push({
					id: `pay-overdue-${Date.now()}`,
					type: 'payment-delay',
					title: 'Overdue Payments Require Action',
					description: `${overdueInvoices.length} invoice(s) totaling ₹${totalOverdue.toLocaleString()} are overdue by ${avgDaysOverdue} days on average.`,
					confidence: 95,
					actionable: true,
					actionTaken: false,
					data: {
						overdueCount: overdueInvoices.length,
						totalAmount: totalOverdue,
						avgDaysOverdue,
						topOverdue: overdueInvoices.slice(0, 3).map(invoice => ({
							invoiceNumber: invoice.invoice_number,
							customer: invoice.customer_name,
							amount: invoice.total_amount,
							daysOverdue: Math.round(invoice.days_overdue)
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
			if (paymentMethods.length) {
				const topMethod = paymentMethods[0];
				const totalCount = paymentMethods.reduce((sum, method) => sum + method.count, 0);
				const percentage = totalCount ? Math.round((topMethod.count / totalCount) * 100) : 0;

				insights.push({
					id: `pay-method-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Payment Preference Insight',
					description: `${percentage}% of customers prefer ${topMethod.payment_method || 'cash'}.`,
					confidence: 80,
					actionable: true,
					actionTaken: false,
					data: {
						preferredMethod: topMethod.payment_method || 'cash',
						percentage,
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
	}

	async analyzeFeedback(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const feedbackQuery = `
				SELECT 
					AVG(rating) as avg_rating,
					COUNT(*) as total_feedback,
					SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_count,
					SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_count
				FROM feedback
				WHERE tenant_id = ?
					${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '30 days'
	`;			const feedbackStats = await db.get(feedbackQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => null);
			if (feedbackStats && feedbackStats.total_feedback > 0) {
				const avgRating = parseFloat(feedbackStats.avg_rating.toFixed(1));

				if (avgRating >= 4.5) {
					insights.push({
						id: `fb-excellent-${Date.now()}`,
						type: 'feedback-pattern',
						title: 'Excellent Customer Satisfaction',
						description: `Average rating is ${avgRating}/5 with ${feedbackStats.positive_count} positive reviews.`,
						confidence: 90,
						actionable: false,
						actionTaken: false,
						data: feedbackStats,
						createdAt: new Date()
					});
				} else if (avgRating < 3.5) {
					insights.push({
						id: `fb-low-${Date.now()}`,
						type: 'feedback-pattern',
						title: 'Customer Satisfaction Needs Attention',
						description: `Average rating dropped to ${avgRating}/5 with ${feedbackStats.negative_count} negative reviews.`,
						confidence: 88,
						actionable: true,
						actionTaken: false,
						data: feedbackStats,
						createdAt: new Date()
					});
				}
			}
		} catch (error) {
			console.error('Error analyzing feedback:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async identifyOpportunities(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			const bundleQuery = `
				SELECT 
					ii1.item_name as item1,
					ii2.item_name as item2,
					COUNT(*) as frequency
				FROM invoice_items ii1
				JOIN invoice_items ii2 ON ii1.invoice_id = ii2.invoice_id AND ii1.item_id < ii2.item_id
				JOIN invoices i ON ii1.invoice_id = i.id
				WHERE i.tenant_id = ?
					${branchId ? 'AND i.branch_id = ?' : ''}
				GROUP BY ii1.item_name, ii2.item_name
				HAVING frequency >= 3
				ORDER BY frequency DESC
				LIMIT 3
			`;

			const bundles = await db.all(bundleQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []) || [];
			if (bundles.length) {
				const topBundle = bundles[0];
				insights.push({
					id: `opp-bundle-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Bundle Opportunity Detected',
					description: `"${topBundle.item1}" and "${topBundle.item2}" sell together frequently. Consider a combo offer.`,
					confidence: 85,
					actionable: true,
					actionTaken: false,
					data: { bundles },
					createdAt: new Date()
				});
			}

			const peakHourQuery = `
				SELECT 
					EXTRACT(HOUR FROM created_at)::INTEGER as hour,
					COUNT(*) as order_count
				FROM invoices
				WHERE tenant_id = ?
					${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '30 days'
				GROUP BY hour
				ORDER BY order_count DESC
				LIMIT 3
			`;

			const peakHours = await db.all(peakHourQuery, branchId ? [tenantId, branchId] : [tenantId]) || [];
			if (peakHours.length) {
				const formatHour = (hour) => {
					if (hour === 0) return '12 AM';
					if (hour < 12) return `${hour} AM`;
					if (hour === 12) return '12 PM';
					return `${hour - 12} PM`;
				};

				insights.push({
					id: `opp-peak-${Date.now()}`,
					type: 'business-opportunity',
					title: 'Peak Hours Identified',
					description: `Busiest hours: ${peakHours.map(p => formatHour(p.hour)).join(', ')}. Ensure adequate staffing.`,
					confidence: 82,
					actionable: true,
					actionTaken: false,
					data: {
						peakHours: peakHours.map(p => ({
							hour: formatHour(p.hour),
							orderCount: p.order_count
						}))
					},
					createdAt: new Date()
				});
			}
		} catch (error) {
			console.error('Error identifying opportunities:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ FINANCIAL RISK MODULE ============
	async analyzeFinancialRisk(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Cash Flow Analysis
			const cashFlowQuery = `
				SELECT 
					SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_inflow,
					SUM(CASE WHEN status IN ('draft', 'partial') THEN total_amount ELSE 0 END) as pending_amount,
					SUM(CASE WHEN status = 'paid' AND created_at >= NOW() - INTERVAL '7 days' THEN total_amount ELSE 0 END) as weekly_inflow
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
			`;
			const cashFlow = await db.get(cashFlowQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (cashFlow && cashFlow.pending_amount > cashFlow.weekly_inflow * 2) {
				insights.push({
					id: `fin-cashflow-${Date.now()}`,
					type: 'financial-risk',
					title: 'Cash Flow Warning',
					description: `Pending receivables (₹${cashFlow.pending_amount.toLocaleString()}) exceed 2x weekly inflow. Monitor cash position.`,
					confidence: 92,
					actionable: true,
					actionTaken: false,
					data: cashFlow,
					createdAt: new Date()
				});
			}

			// Outstanding Dues Summary
			const outstandingQuery = `
				SELECT 
					COUNT(*) as overdue_count,
					SUM(total_amount) as overdue_amount,
					AVG(CAST(EXTRACT(EPOCH FROM (NOW() - due_date)) / 86400.0 AS INTEGER)) as avg_days_overdue
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND status IN ('draft', 'partial')
					AND due_date < CURRENT_DATE
			`;
			const outstanding = await db.get(outstandingQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (outstanding && outstanding.overdue_count > 0) {
				insights.push({
					id: `fin-outstanding-${Date.now()}`,
					type: 'financial-risk',
					title: 'Outstanding Dues Alert',
					description: `${outstanding.overdue_count} invoices totaling ₹${outstanding.overdue_amount.toLocaleString()} are overdue by ${Math.round(outstanding.avg_days_overdue)} days on average.`,
					confidence: 95,
					actionable: true,
					actionTaken: false,
					data: outstanding,
					createdAt: new Date()
				});
			}

			// Profitability by Category
			const profitabilityQuery = `
				SELECT 
					i.category,
					SUM(ii.quantity) as units_sold,
					SUM(ii.total) as revenue,
					SUM(ii.quantity * i.cost_price) as cost,
					SUM(ii.total - (ii.quantity * i.cost_price)) as profit,
					ROUND((SUM(ii.total - (ii.quantity * i.cost_price)) / SUM(ii.total)) * 100, 1) as margin_pct
				FROM invoice_items ii
				JOIN inventory i ON ii.item_id = i.id
				JOIN invoices inv ON ii.invoice_id = inv.id
				WHERE inv.tenant_id = ? ${branchId ? 'AND inv.branch_id = ?' : ''}
					AND inv.status = 'paid'
					AND inv.created_at >= NOW() - INTERVAL '30 days'
				GROUP BY i.category
				HAVING units_sold > 0
				ORDER BY margin_pct ASC
				LIMIT 3
			`;
			const lowMarginCategories = await db.all(profitabilityQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (lowMarginCategories.length > 0 && lowMarginCategories[0].margin_pct < 20) {
				insights.push({
					id: `fin-margin-${Date.now()}`,
					type: 'financial-risk',
					title: 'Low Margin Alert',
					description: `Category "${lowMarginCategories[0].category}" has only ${lowMarginCategories[0].margin_pct}% profit margin.`,
					confidence: 85,
					actionable: true,
					actionTaken: false,
					data: { categories: lowMarginCategories },
					createdAt: new Date()
				});
			}

		} catch (error) {
			console.error('Error analyzing financial risk:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ SALES INTELLIGENCE MODULE ============
	async analyzeSalesIntelligence(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Best Selling Items
			const bestSellersQuery = `
				SELECT 
					ii.item_name,
					SUM(ii.quantity) as units_sold,
					SUM(ii.total) as revenue
				FROM invoice_items ii
				JOIN invoices i ON ii.invoice_id = i.id
				WHERE i.tenant_id = ? ${branchId ? 'AND i.branch_id = ?' : ''}
					AND i.status = 'paid'
					AND i.created_at >= NOW() - INTERVAL '30 days'
				GROUP BY ii.item_name
				ORDER BY units_sold DESC
				LIMIT 5
			`;
			const bestSellers = await db.all(bestSellersQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (bestSellers.length > 0) {
				insights.push({
					id: `sales-bestseller-${Date.now()}`,
					type: 'sales-intelligence',
					title: 'Top Performing Products',
					description: `"${bestSellers[0].item_name}" leads with ${bestSellers[0].units_sold} units sold this month.`,
					confidence: 90,
					actionable: false,
					actionTaken: false,
					data: { bestSellers },
					createdAt: new Date()
				});
			}

			// Slow Movers (items with low sales)
			const slowMoversQuery = `
				SELECT 
					i.name,
					i.quantity as stock,
					COALESCE(SUM(ii.quantity), 0) as sold_last_30_days
				FROM inventory i
				LEFT JOIN invoice_items ii ON i.id = ii.item_id
				LEFT JOIN invoices inv ON ii.invoice_id = inv.id 
					AND inv.created_at >= NOW() - INTERVAL '30 days'
					AND inv.status = 'paid'
				WHERE i.tenant_id = ? ${branchId ? 'AND i.branch_id = ?' : ''}
					AND i.quantity > 0
				GROUP BY i.id
				HAVING sold_last_30_days < 3
				ORDER BY i.quantity DESC
				LIMIT 5
			`;
			const slowMovers = await db.all(slowMoversQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (slowMovers.length >= 3) {
				insights.push({
					id: `sales-slowmover-${Date.now()}`,
					type: 'sales-intelligence',
					title: 'Slow Moving Products',
					description: `${slowMovers.length} products have sold less than 3 units this month. Consider promotions.`,
					confidence: 82,
					actionable: true,
					actionTaken: false,
					data: { slowMovers },
					createdAt: new Date()
				});
			}

			// Average Transaction Value
			const avgTransactionQuery = `
				SELECT 
					AVG(total_amount) as avg_order_value,
					COUNT(*) as order_count,
					SUM(total_amount) as total_revenue
			FROM invoices
			WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
				AND status = 'paid'
				AND created_at >= NOW() - INTERVAL '30 days'
		`;
		const avgTransaction = await db.get(avgTransactionQuery, branchId ? [tenantId, branchId] : [tenantId]);			if (avgTransaction && avgTransaction.order_count > 0) {
				insights.push({
					id: `sales-aov-${Date.now()}`,
					type: 'sales-intelligence',
					title: 'Average Order Value Insight',
					description: `Current average order value is ₹${Math.round(avgTransaction.avg_order_value).toLocaleString()} from ${avgTransaction.order_count} orders.`,
					confidence: 88,
					actionable: true,
					actionTaken: false,
					data: avgTransaction,
					createdAt: new Date()
				});
			}

			// Sales Comparison (this month vs last month)
			const salesComparisonQuery = `
				SELECT 
					TO_CHAR(created_at, 'YYYY-MM') as month,
					COUNT(*) as order_count,
					SUM(total_amount) as revenue
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND status = 'paid'
					AND created_at >= NOW() - INTERVAL '60 days'
				GROUP BY month
				ORDER BY month DESC
				LIMIT 2
			`;
			const salesComparison = await db.all(salesComparisonQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (salesComparison.length === 2) {
				const current = salesComparison[0];
				const previous = salesComparison[1];
				const growth = previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue * 100).toFixed(1) : 0;
				
				if (Math.abs(growth) > 5) {
					insights.push({
						id: `sales-comparison-${Date.now()}`,
						type: 'sales-intelligence',
						title: growth > 0 ? 'Sales Growth Detected' : 'Sales Decline Alert',
						description: `Sales ${growth > 0 ? 'increased' : 'decreased'} by ${Math.abs(growth)}% compared to last month.`,
						confidence: 90,
						actionable: growth < 0,
						actionTaken: false,
						data: { current, previous, growth: parseFloat(growth) },
						createdAt: new Date()
					});
				}
			}

		} catch (error) {
			console.error('Error analyzing sales intelligence:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ CUSTOMER ANALYTICS MODULE ============
	async analyzeCustomerAnalytics(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Customer Lifetime Value (CLV)
			const clvQuery = `
				SELECT 
					c.id,
					c.name,
					COUNT(i.id) as order_count,
					SUM(i.total_amount) as lifetime_value,
					AVG(i.total_amount) as avg_order_value,
					MAX(i.created_at) as last_purchase_date
				FROM customers c
				LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'paid'
				WHERE c.tenant_id = ? ${branchId ? 'AND c.branch_id = ?' : ''}
				GROUP BY c.id
				HAVING lifetime_value > 0
				ORDER BY lifetime_value DESC
				LIMIT 10
			`;
			const topCustomers = await db.all(clvQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (topCustomers.length > 0) {
				const totalCLV = topCustomers.reduce((sum, c) => sum + c.lifetime_value, 0);
				insights.push({
					id: `cust-clv-${Date.now()}`,
					type: 'customer-analytics',
					title: 'High-Value Customers Identified',
					description: `Top 10 customers contribute ₹${totalCLV.toLocaleString()}. "${topCustomers[0].name}" leads with ₹${topCustomers[0].lifetime_value.toLocaleString()}.`,
					confidence: 93,
					actionable: true,
					actionTaken: false,
					data: { topCustomers: topCustomers.slice(0, 5) },
					createdAt: new Date()
				});
			}

			// Churn Risk Scoring
			const churnRiskQuery = `
				SELECT 
					c.id,
					c.name,
					c.email,
					MAX(i.created_at) as last_order_date,
					COUNT(i.id) as total_orders,
					CAST(EXTRACT(EPOCH FROM (NOW() - MAX(i.created_at))) / 86400.0 AS INTEGER) as days_since_last_order
				FROM customers c
				LEFT JOIN invoices i ON c.id = i.customer_id
				WHERE c.tenant_id = ? ${branchId ? 'AND c.branch_id = ?' : ''}
				GROUP BY c.id
				HAVING total_orders > 2 AND days_since_last_order > 45
				ORDER BY days_since_last_order DESC
				LIMIT 10
			`;
			const churnRisk = await db.all(churnRiskQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (churnRisk.length > 0) {
				insights.push({
					id: `cust-churn-${Date.now()}`,
					type: 'customer-analytics',
					title: 'Customer Churn Risk Detected',
					description: `${churnRisk.length} repeat customers haven't ordered in 45+ days. Risk of losing them.`,
					confidence: 85,
					actionable: true,
					actionTaken: false,
					data: { atRiskCustomers: churnRisk.slice(0, 5) },
					createdAt: new Date()
				});
			}

			// Purchase Frequency Analysis
			const frequencyQuery = `
				SELECT 
					COUNT(DISTINCT customer_id) as total_customers,
					SUM(CASE WHEN order_count = 1 THEN 1 ELSE 0 END) as one_time,
					SUM(CASE WHEN order_count BETWEEN 2 AND 5 THEN 1 ELSE 0 END) as occasional,
					SUM(CASE WHEN order_count > 5 THEN 1 ELSE 0 END) as frequent
				FROM (
					SELECT customer_id, COUNT(*) as order_count
					FROM invoices
					WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
						AND status = 'paid'
						AND customer_id IS NOT NULL
					GROUP BY customer_id
				)
			`;
			const frequency = await db.get(frequencyQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (frequency && frequency.total_customers > 0) {
				const oneTimePercent = Math.round((frequency.one_time / frequency.total_customers) * 100);
				if (oneTimePercent > 60) {
					insights.push({
						id: `cust-onetime-${Date.now()}`,
						type: 'customer-analytics',
						title: 'High One-Time Customer Rate',
						description: `${oneTimePercent}% of customers made only one purchase. Focus on retention strategies.`,
						confidence: 87,
						actionable: true,
						actionTaken: false,
						data: frequency,
						createdAt: new Date()
					});
				}
			}

		} catch (error) {
			console.error('Error analyzing customer analytics:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ PREDICTIVE ANALYTICS MODULE ============
	async analyzePredictive(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Demand Forecasting
			const demandQuery = `
				SELECT 
					ii.item_name,
					SUM(ii.quantity) as total_sold,
					COUNT(DISTINCT i.id) as order_frequency,
					AVG(ii.quantity) as avg_qty_per_order
				FROM invoice_items ii
				JOIN invoices i ON ii.invoice_id = i.id
				WHERE i.tenant_id = ? ${branchId ? 'AND i.branch_id = ?' : ''}
					AND i.status = 'paid'
					AND i.created_at >= NOW() - INTERVAL '60 days'
				GROUP BY ii.item_name
				HAVING total_sold > 10
				ORDER BY total_sold DESC
				LIMIT 10
			`;
			const demandForecast = await db.all(demandQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (demandForecast.length > 0) {
				const projected = demandForecast[0].total_sold * 0.5; // Simple 30-day projection
				insights.push({
					id: `pred-demand-${Date.now()}`,
					type: 'predictive-analytics',
					title: 'Demand Forecast Available',
					description: `"${demandForecast[0].item_name}" projected to sell ~${Math.round(projected)} units next month based on trends.`,
					confidence: 75,
					actionable: true,
					actionTaken: false,
					data: { forecast: demandForecast.slice(0, 5) },
					createdAt: new Date()
				});
			}

			// Stock-out Prediction
			const stockoutQuery = `
				SELECT 
					i.name,
					i.quantity as current_stock,
					i.min_stock_level,
					COALESCE(AVG(daily_sales.qty), 0) as avg_daily_sales,
					CASE 
						WHEN COALESCE(AVG(daily_sales.qty), 0) > 0 
						THEN CAST(i.quantity / AVG(daily_sales.qty) AS INTEGER)
						ELSE 999
					END as days_until_stockout
				FROM inventory i
				LEFT JOIN (
					SELECT 
						ii.item_id,
						DATE(inv.created_at) as sale_date,
						SUM(ii.quantity) as qty
					FROM invoice_items ii
					JOIN invoices inv ON ii.invoice_id = inv.id
					WHERE inv.tenant_id = ? ${branchId ? 'AND inv.branch_id = ?' : ''}
						AND inv.status = 'paid'
						AND inv.created_at >= NOW() - INTERVAL '30 days'
					GROUP BY ii.item_id, sale_date
				) daily_sales ON i.id = daily_sales.item_id
				WHERE i.tenant_id = ? ${branchId ? 'AND i.branch_id = ?' : ''}
					AND i.quantity > 0
				GROUP BY i.id
				HAVING days_until_stockout < 14 AND days_until_stockout > 0
				ORDER BY days_until_stockout ASC
				LIMIT 5
			`;
			const stockoutRisk = await db.all(stockoutQuery, 
				branchId ? [tenantId, branchId, tenantId, branchId] : [tenantId, tenantId]
			).catch(() => []);
			
			if (stockoutRisk.length > 0) {
				insights.push({
					id: `pred-stockout-${Date.now()}`,
					type: 'predictive-analytics',
					title: 'Stock-out Risk Alert',
					description: `${stockoutRisk.length} items may run out within 2 weeks based on current sales velocity.`,
					confidence: 80,
					actionable: true,
					actionTaken: false,
					data: { atRiskItems: stockoutRisk },
					createdAt: new Date()
				});
			}

			// Revenue Projection
		const revenueProjectionQuery = `
			SELECT 
				SUM(total_amount) as last_30_days_revenue,
				COUNT(*) as order_count,
				AVG(total_amount) as avg_order_value
			FROM invoices
			WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
				AND status = 'paid'
				AND created_at >= NOW() - INTERVAL '30 days'
		`;
		const revenueData = await db.get(revenueProjectionQuery, branchId ? [tenantId, branchId] : [tenantId]);			if (revenueData && revenueData.order_count > 0) {
				const projectedRevenue = revenueData.last_30_days_revenue; // Simple projection
				insights.push({
					id: `pred-revenue-${Date.now()}`,
					type: 'predictive-analytics',
					title: 'Revenue Projection',
					description: `Based on current trends, projected revenue for next month: ₹${Math.round(projectedRevenue).toLocaleString()}.`,
					confidence: 70,
					actionable: false,
					actionTaken: false,
					data: { ...revenueData, projectedRevenue },
					createdAt: new Date()
				});
			}

		} catch (error) {
			console.error('Error analyzing predictive analytics:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ FRAUD & ANOMALY DETECTION MODULE ============
	async analyzeFraudAndAnomalies(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Unusual Transaction Patterns
			// Calculate standard deviation manually since SQLite doesn't have STDEV
			const allOrdersQuery = `
				SELECT total_amount
				FROM invoices
			WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
				AND status = 'paid'
				AND created_at >= NOW() - INTERVAL '30 days'
		`;
		const allOrders = await db.all(allOrdersQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);			if (allOrders.length > 5) {
				const amounts = allOrders.map(o => o.total_amount);
				const avg_amount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
				const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg_amount, 2), 0) / amounts.length;
				const std_dev = Math.sqrt(variance);
				const threshold = avg_amount + (3 * std_dev);
				const unusualQuery = `
					SELECT id, invoice_number, total_amount, created_at, customer_name
					FROM invoices
					WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
						AND status = 'paid'
						AND total_amount > ?
						AND created_at >= NOW() - INTERVAL '7 days'
					ORDER BY total_amount DESC
					LIMIT 5
				`;
				const unusualOrders = await db.all(unusualQuery, 
					branchId ? [tenantId, branchId, threshold] : [tenantId, threshold]
				).catch(() => []);
				
				if (unusualOrders.length > 0) {
					insights.push({
						id: `fraud-unusual-${Date.now()}`,
						type: 'fraud-detection',
						title: 'Unusual Transaction Detected',
						description: `${unusualOrders.length} order(s) significantly exceed normal transaction amounts. Review for accuracy.`,
						confidence: 75,
						actionable: true,
						actionTaken: false,
						data: { unusualOrders, threshold },
						createdAt: new Date()
					});
				}
			}

			// Duplicate Transaction Detection
			const duplicateQuery = `
				SELECT 
					customer_id,
					total_amount,
					COUNT(*) as duplicate_count,
					GROUP_CONCAT(id) as invoice_ids
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '1 day'
					AND customer_id IS NOT NULL
				GROUP BY customer_id, total_amount, DATE(created_at)
				HAVING duplicate_count > 1
			`;
			const duplicates = await db.all(duplicateQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (duplicates.length > 0) {
				insights.push({
					id: `fraud-duplicate-${Date.now()}`,
					type: 'fraud-detection',
					title: 'Potential Duplicate Transactions',
					description: `${duplicates.length} possible duplicate transaction(s) detected. Verify for accuracy.`,
					confidence: 82,
					actionable: true,
					actionTaken: false,
					data: { duplicates },
					createdAt: new Date()
				});
			}

			// Inventory Shrinkage Detection
			const shrinkageQuery = `
				SELECT 
					i.name,
					i.quantity as current_stock,
					COALESCE(SUM(ii.quantity), 0) as recorded_sales,
					(SELECT quantity FROM inventory WHERE id = i.id) as expected_stock
				FROM inventory i
				LEFT JOIN invoice_items ii ON i.id = ii.item_id
				LEFT JOIN invoices inv ON ii.invoice_id = inv.id 
					AND inv.created_at >= NOW() - INTERVAL '7 days'
				WHERE i.tenant_id = ? ${branchId ? 'AND i.branch_id = ?' : ''}
				GROUP BY i.id
				HAVING recorded_sales > 0 AND current_stock > expected_stock
				LIMIT 5
			`;
			const shrinkage = await db.all(shrinkageQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (shrinkage.length > 0) {
				insights.push({
					id: `fraud-shrinkage-${Date.now()}`,
					type: 'fraud-detection',
					title: 'Inventory Discrepancy Detected',
					description: `${shrinkage.length} item(s) show stock inconsistencies. Conduct physical inventory check.`,
					confidence: 70,
					actionable: true,
					actionTaken: false,
					data: { items: shrinkage },
					createdAt: new Date()
				});
			}

		} catch (error) {
			console.error('Error analyzing fraud and anomalies:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ STAFF & OPERATIONS MODULE ============
	async analyzeStaffAndOperations(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Peak Hour Analysis
			const peakHoursQuery = `
				SELECT 
					EXTRACT(HOUR FROM created_at)::INTEGER as hour,
					COUNT(*) as order_count,
					SUM(total_amount) as revenue
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '30 days'
				GROUP BY hour
				ORDER BY order_count DESC
				LIMIT 5
			`;
			const peakHours = await db.all(peakHoursQuery, branchId ? [tenantId, branchId] : [tenantId]).catch(() => []);
			
			if (peakHours.length > 0) {
				const formatHour = (h) => {
					if (h === 0) return '12 AM';
					if (h < 12) return `${h} AM`;
					if (h === 12) return '12 PM';
					return `${h - 12} PM`;
				};
				
				insights.push({
					id: `staff-peakhours-${Date.now()}`,
					type: 'staff-operations',
					title: 'Peak Business Hours Identified',
					description: `Highest activity at ${formatHour(peakHours[0].hour)} with ${peakHours[0].order_count} orders. Optimize staffing.`,
					confidence: 88,
					actionable: true,
					actionTaken: false,
					data: { peakHours: peakHours.map(p => ({ hour: formatHour(p.hour), orders: p.order_count, revenue: p.revenue })) },
					createdAt: new Date()
				});
			}

			// Branch Performance Comparison (if multiple branches)
			if (!branchId) {
				const branchComparisonQuery = `
					SELECT 
						b.name as branch_name,
						COUNT(i.id) as order_count,
						SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as revenue,
						AVG(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE NULL END) as avg_order_value
					FROM branches b
					LEFT JOIN invoices i ON b.id = i.branch_id 
						AND i.created_at >= NOW() - INTERVAL '30 days'
					WHERE b.tenant_id = ?
					GROUP BY b.id
					HAVING order_count > 0
					ORDER BY revenue DESC
				`;
				const branchPerformance = await db.all(branchComparisonQuery, [tenantId]).catch(() => []);
				
				if (branchPerformance.length > 1) {
					const topBranch = branchPerformance[0];
					const bottomBranch = branchPerformance[branchPerformance.length - 1];
					const gap = topBranch.revenue - bottomBranch.revenue;
					
					insights.push({
						id: `staff-branchcomp-${Date.now()}`,
						type: 'staff-operations',
						title: 'Branch Performance Variance',
						description: `"${topBranch.branch_name}" leads with ₹${topBranch.revenue.toLocaleString()}, while "${bottomBranch.branch_name}" lags by ₹${gap.toLocaleString()}.`,
						confidence: 90,
						actionable: true,
						actionTaken: false,
						data: { branches: branchPerformance },
						createdAt: new Date()
					});
				}
			}

			// Order Processing Efficiency
		const efficiencyQuery = `
			SELECT 
				COUNT(*) as total_orders,
				SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as completed,
				SUM(CASE WHEN status IN ('draft', 'partial') THEN 1 ELSE 0 END) as pending
			FROM invoices
			WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
				AND created_at >= NOW() - INTERVAL '7 days'
		`;
		const efficiency = await db.get(efficiencyQuery, branchId ? [tenantId, branchId] : [tenantId]);			if (efficiency && efficiency.total_orders > 0) {
				const completionRate = Math.round((efficiency.completed / efficiency.total_orders) * 100);
				if (completionRate < 80) {
					insights.push({
						id: `staff-efficiency-${Date.now()}`,
						type: 'staff-operations',
						title: 'Order Completion Rate Low',
						description: `Only ${completionRate}% of orders completed this week. ${efficiency.pending} orders still pending.`,
						confidence: 85,
						actionable: true,
						actionTaken: false,
						data: efficiency,
						createdAt: new Date()
					});
				}
			}

		} catch (error) {
			console.error('Error analyzing staff and operations:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	// ============ EXECUTIVE INTELLIGENCE MODULE ============
	async generateExecutiveIntelligence(tenantId, branchId) {
		const insights = [];
		const db = await getDb();

		try {
			// Daily Summary Stats
			const dailySummaryQuery = `
				SELECT 
					COUNT(*) as today_orders,
					SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as today_revenue,
					AVG(CASE WHEN status = 'paid' THEN total_amount ELSE NULL END) as avg_order_value
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND DATE(created_at) = CURRENT_DATE
			`;
			const dailyStats = await db.get(dailySummaryQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (dailyStats && dailyStats.today_orders > 0) {
				insights.push({
					id: `exec-daily-${Date.now()}`,
					type: 'executive-summary',
					title: 'Today\'s Performance',
					description: `${dailyStats.today_orders} orders totaling ₹${Math.round(dailyStats.today_revenue).toLocaleString()} with avg value ₹${Math.round(dailyStats.avg_order_value || 0).toLocaleString()}.`,
					confidence: 95,
					actionable: false,
					actionTaken: false,
					data: dailyStats,
					createdAt: new Date()
				});
			}

			// Weekly Trend Analysis
			const weeklyTrendQuery = `
				SELECT 
					TO_CHAR(created_at, 'IYYY-W') as week,
					COUNT(*) as orders,
					SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as revenue
				FROM invoices
				WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}
					AND created_at >= NOW() - INTERVAL '14 days'
				GROUP BY week
				ORDER BY week DESC
				LIMIT 2
			`;
			const weeklyTrend = await db.all(weeklyTrendQuery, branchId ? [tenantId, branchId] : [tenantId]);
			
			if (weeklyTrend.length === 2) {
				const currentWeek = weeklyTrend[0];
				const lastWeek = weeklyTrend[1];
				const growth = lastWeek.revenue > 0 ? 
					((currentWeek.revenue - lastWeek.revenue) / lastWeek.revenue * 100).toFixed(1) : 0;
				
				insights.push({
					id: `exec-weekly-${Date.now()}`,
					type: 'executive-summary',
					title: 'Weekly Performance Trend',
					description: `This week: ₹${currentWeek.revenue.toLocaleString()} (${growth > 0 ? '+' : ''}${growth}% vs last week).`,
					confidence: 92,
					actionable: false,
					actionTaken: false,
					data: { currentWeek, lastWeek, growth: parseFloat(growth) },
					createdAt: new Date()
				});
			}

			// Key Metrics Dashboard
			const kpiQuery = `
				SELECT 
					(SELECT COUNT(*) FROM customers WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}) as total_customers,
					(SELECT COUNT(*) FROM inventory WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''}) as total_products,
					(SELECT COUNT(*) FROM invoices WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''} AND status = 'paid') as total_sales,
					(SELECT SUM(total_amount) FROM invoices WHERE tenant_id = ? ${branchId ? 'AND branch_id = ?' : ''} AND status = 'paid') as lifetime_revenue
			`;
			const params = branchId ? 
				[tenantId, branchId, tenantId, branchId, tenantId, branchId, tenantId, branchId] :
				[tenantId, tenantId, tenantId, tenantId];
			const kpis = await db.get(kpiQuery, params);
			
			if (kpis) {
				insights.push({
					id: `exec-kpi-${Date.now()}`,
					type: 'executive-summary',
					title: 'Business KPIs Overview',
					description: `${kpis.total_customers} customers, ${kpis.total_products} products, ${kpis.total_sales} completed sales, ₹${(kpis.lifetime_revenue || 0).toLocaleString()} lifetime revenue.`,
					confidence: 98,
					actionable: false,
					actionTaken: false,
					data: kpis,
					createdAt: new Date()
				});
			}

		} catch (error) {
			console.error('Error generating executive intelligence:', error);
		} finally {
			await db.close();
		}

		return insights;
	}

	async enhanceWithAI(insights) {
		if (!this.openaiApiKey || !Array.isArray(insights) || insights.length === 0) {
			return insights;
		}

		try {
			const context = insights
				.map(insight => `${insight.type}: ${insight.title} - ${insight.description}`)
				.join('\n');

			const systemPrompt = 'You are an AI assistant that summarizes business insights for SMB owners. Focus on clarity, urgency, and next steps.';
			const userPrompt = `Summarize these insights and recommend top 3 focus areas:\n${context}`;
			const headers = {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.openaiApiKey}`
			};

			const chatPayload = {
				model: this.openaiModel,
				temperature: 0.2,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt }
				]
			};

			let response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers,
				body: JSON.stringify(chatPayload)
			});

			let aiSummary = null;

			if (response.status === 404) {
				const responsesPayload = {
					model: this.openaiModel,
					temperature: 0.2,
					instructions: systemPrompt,
					input: userPrompt
				};

				response = await fetch('https://api.openai.com/v1/responses', {
					method: 'POST',
					headers,
					body: JSON.stringify(responsesPayload)
				});

				if (!response.ok) {
					const errorBody = await response.text().catch(() => '');
					throw new Error(`OpenAI responses API error: ${response.status} ${errorBody}`);
				}

				const fallbackData = await response.json();
				aiSummary = this.extractTextFromResponsesApi(fallbackData);
			} else {
				if (!response.ok) {
					const errorBody = await response.text().catch(() => '');
					throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
				}

				const data = await response.json();
				aiSummary = data.choices?.[0]?.message?.content?.trim();
			}

			if (aiSummary) {
				return [
					...insights,
					{
						id: `ai-summary-${Date.now()}`,
						type: 'ai-summary',
						title: 'AI-Powered Insight Summary',
						description: aiSummary,
						confidence: 70,
						actionable: true,
						actionTaken: false,
						data: { provider: 'openai', model: this.openaiModel },
						createdAt: new Date()
					}
				];
			}
		} catch (error) {
			console.error('Error enhancing insights with AI:', error);
		}

		return insights;
	}

	extractTextFromResponsesApi(payload) {
		if (!payload?.output?.length) {
			return null;
		}

		for (const message of payload.output) {
			if (!message?.content?.length) continue;
			for (const block of message.content) {
				if (block?.type === 'text' && block.text) {
					return block.text.trim();
				}
			}
		}

		return null;
	}
}

export default new AIInsightsService();