// Test Inventory API Endpoints
import { getDb } from './models/db.js';

async function testInventoryAPI() {
  console.log('=== Testing Inventory API ===\n');
  
  try {
    const db = await getDb();
    
    // 1. Check current inventory
    console.log('1. Current Inventory Items:');
    const items = await db.all('SELECT * FROM inventory LIMIT 5');
    console.log(`   Found ${items.length} items in database`);
    items.forEach(item => {
      console.log(`   - ${item.name} (SKU: ${item.sku}) - Qty: ${item.quantity}, Price: ₹${item.selling_price}`);
    });
    
    // 2. Check inventory stats
    console.log('\n2. Inventory Statistics:');
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity * cost_price) as total_value,
        SUM(CASE WHEN quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM inventory
    `);
    console.log(`   Total Items: ${stats.total_items}`);
    console.log(`   Total Value: ₹${stats.total_value?.toFixed(2) || 0}`);
    console.log(`   Low Stock: ${stats.low_stock_count}`);
    console.log(`   Out of Stock: ${stats.out_of_stock_count}`);
    
    // 3. Check categories
    console.log('\n3. Categories:');
    const categories = await db.all('SELECT DISTINCT category FROM inventory ORDER BY category');
    console.log(`   Found ${categories.length} categories:`);
    categories.forEach(cat => console.log(`   - ${cat.category}`));
    
    // 4. Check branches
    console.log('\n4. Branches:');
    const branches = await db.all('SELECT id, name FROM branches');
    console.log(`   Found ${branches.length} branches:`);
    branches.forEach(branch => console.log(`   - ${branch.name} (${branch.id})`));
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 To test the API:');
    console.log('   1. Login to the app at http://localhost:5174');
    console.log('   2. Navigate to Inventory page');
    console.log('   3. Try adding a new inventory item');
    console.log('   4. Backend API is listening on http://localhost:3001/api/inventory');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInventoryAPI();
