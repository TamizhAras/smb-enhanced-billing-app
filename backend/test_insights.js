import AIInsightsService from './services/AIInsightsService.new.js';

async function testInsights() {
  const tenantId = '7413d201-a37d-4af5-bbde-74bf24cb17f3';
  const branchId = '0b4a66ac-9ad9-4412-a8a0-c3edd69f86bf';
  
  console.log('Testing with tenantId:', tenantId, 'branchId:', branchId);
  
  try {
    const insights = await AIInsightsService.generateInsights(tenantId, branchId);
    console.log('Generated insights:', JSON.stringify(insights, null, 2));
  } catch (error) {
    console.error('Error generating insights:', error);
  }
}

testInsights();
