# AI Insights System - Comprehensive Design

## Insight Categories & Role Permissions

### Legend
- 👤 **Staff** (including managers) - Branch-level insights
- 👑 **Owner** (admin) - All branches, strategic insights

---

## 1. SALES & REVENUE INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Daily Sales Summary | ✅ | ✅ | Today's sales vs average |
| Product-wise Revenue | ✅ | ✅ | Revenue breakdown by product |
| Profitability by Product | ❌ | ✅ | Margin analysis (cost data sensitive) |
| Profitability by Category | ❌ | ✅ | Category-level margins |
| Revenue Forecast (30/60/90 days) | ❌ | ✅ | Time-series predictions |
| Peak Sales Day/Hour | ✅ | ✅ | Best performing times |
| What-if Price Analysis | ❌ | ✅ | Price change impact simulation |
| Territory/Branch Comparison | ❌ | ✅ | Cross-branch performance |

---

## 2. CUSTOMER INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| VIP Customer Identification | ✅ | ✅ | Top spenders |
| Customer Segmentation | ✅ | ✅ | High-value, discount shoppers, frequent, seasonal |
| Customer Behavior Analysis | ✅ | ✅ | Purchase patterns |
| Churn Prediction | ✅ | ✅ | Likely to stop buying in 30 days |
| Lifetime Value (CLV) | ❌ | ✅ | Expected total revenue per customer |
| Inactive Customer Alerts | ✅ | ✅ | No orders in 60+ days |
| Lost Customer Reactivation | ✅ | ✅ | Inactive 90 days but recoverable |
| Personalized Offer Suggestions | ✅ | ✅ | Cross-sell recommendations |
| Repeat Purchase Prediction | ✅ | ✅ | When customer likely to return |
| Credit Limit Recommendations | ❌ | ✅ | AI-suggested credit limits |

---

## 3. INVENTORY INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Out of Stock Alert | ✅ | ✅ | Items at zero quantity |
| Low Stock Warning | ✅ | ✅ | Below minimum level |
| Stock-out Prediction | ✅ | ✅ | When will stock finish |
| Slow-Moving Stock | ✅ | ✅ | Items not sold in 30 days |
| Overstock Advisory | ✅ | ✅ | Excess inventory |
| Optimal Reorder Quantity | ❌ | ✅ | AI-suggested reorder points |
| Bundle Performance | ✅ | ✅ | Products bought together |
| Purchase Order Recommendations | ❌ | ✅ | Suggested PO quantities |
| Demand Forecasting | ❌ | ✅ | Units to stock next month |

---

## 4. FINANCIAL INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Payment Method Preferences | ✅ | ✅ | Cash vs digital breakdown |
| Overdue Payments Alert | ✅ | ✅ | Past-due invoices |
| Cash Flow Risk Alert | ❌ | ✅ | Short-term shortage warnings |
| Outstanding Dues Prioritization | ✅ | ✅ | Ranked by likelihood to pay |
| Expense Drift Detection | ❌ | ✅ | Unusual cost increases |
| Daily Cash Position | ❌ | ✅ | Cash in vs cash out |

---

## 5. FRAUD & ANOMALY DETECTION

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Duplicate Invoice Detection | ✅ | ✅ | Same amount/customer in short time |
| Unusual Discount Alert | ✅ | ✅ | Discounts above threshold |
| Price Change Alert | ✅ | ✅ | Sudden price modifications |
| Suspicious Refund Alert | ❌ | ✅ | Pattern-based refund analysis |
| Invoice Anomaly Score | ❌ | ✅ | Overall fraud probability |
| Fraud Prediction | ❌ | ✅ | Invoice manipulation likelihood |

---

## 6. STAFF & OPERATIONS INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Staff Performance Summary | ❌ | ✅ | Sales per staff member |
| Vendor Performance Scoring | ❌ | ✅ | Delivery times, quality |
| Branch Performance Comparison | ❌ | ✅ | Multi-branch analysis |
| Operational Risk Map | ❌ | ✅ | Areas needing attention |
| Staffing Recommendations | ❌ | ✅ | Optimal staff during peak hours |

---

## 7. MARKETING INSIGHTS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Campaign Recommendations | ❌ | ✅ | Who to target with what |
| Best Channel per Customer | ❌ | ✅ | SMS/WhatsApp/Email preference |
| Promotion Effectiveness | ❌ | ✅ | Past campaign analysis |
| Seasonal Opportunity | ✅ | ✅ | Festival/holiday predictions |

---

## 8. AI SUMMARIES & BRIEFINGS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Daily Business Summary | ✅ | ✅ | Key metrics snapshot |
| Weekly Business Summary | ✅ | ✅ | Week-over-week comparison |
| CEO Daily Briefing | ❌ | ✅ | Strategic overview |
| Strategic Recommendations | ❌ | ✅ | AI expansion/growth suggestions |
| Customer Complaints Summary | ✅ | ✅ | Support ticket clusters |

---

## 9. FORECASTING & PREDICTIONS

| Insight | Staff | Owner | Description |
|---------|-------|-------|-------------|
| Revenue Forecast (Time Series) | ❌ | ✅ | 30/60/90 day predictions |
| Demand Forecast | ❌ | ✅ | Unit-level predictions |
| Customer Churn Forecast | ✅ | ✅ | Churn likelihood scores |
| Sales Pipeline Forecast | ❌ | ✅ | Deal closure predictions |
| Seasonal Adjustment | ❌ | ✅ | Festival/holiday impact |

---

## Seasonal/Regional Factors for Forecasting

### India-Specific
- **Festivals**: Diwali, Holi, Eid, Christmas, Pongal, Onam, Durga Puja
- **Shopping Seasons**: Wedding season (Nov-Feb), Back to school (June)
- **Sales Events**: Republic Day, Independence Day sales
- **Regional Holidays**: State-specific festivals

### School Calendar Impact
- Summer vacation (April-June): Certain products spike
- School opening (June-July): Stationery, uniforms
- Exam season (March, Oct): Study materials

### Economic Factors
- Month-end salary cycles (25th-5th)
- Quarter-end business purchases
- Financial year end (March)

---

## Priority Levels

### Critical (Red) - Immediate Action
- Out of stock on popular items
- Cash flow shortage predicted
- Fraud detected
- Customer churn imminent

### Warning (Yellow) - Action Needed
- Low stock alerts
- Overdue payments
- Slow-moving inventory
- Expense drift

### Informational (Blue) - Good to Know
- Performance summaries
- Trend analysis
- Recommendations

### Positive (Green) - Celebrations
- Revenue growth
- Customer acquisition
- Target achievements
