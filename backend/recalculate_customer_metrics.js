import { CustomerRepository } from './repositories/CustomerRepository.js';
import { getDb } from './models/db.js';

async function recalculateAllCustomerMetrics() {
  console.log('Starting customer metrics recalculation...');
  
  const db = await getDb();
  const customerRepository = new CustomerRepository();
  
  try {
    // Get all customers
    const customers = await db.all('SELECT id, name FROM customers');
    console.log(`Found ${customers.length} customers`);
    
    // Update metrics for each customer
    let updated = 0;
    for (const customer of customers) {
      try {
        await customerRepository.updateSpentMetrics(customer.id);
        updated++;
        console.log(`✓ Updated metrics for: ${customer.name}`);
      } catch (error) {
        console.error(`✗ Error updating ${customer.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully updated metrics for ${updated}/${customers.length} customers`);
    
    // Display summary
    const summary = await db.all(`
      SELECT 
        name,
        total_orders,
        total_spent,
        average_order_value,
        last_order_date
      FROM customers
      WHERE total_orders > 0
      ORDER BY total_spent DESC
    `);
    
    console.log('\n📊 Customer Metrics Summary:');
    console.log('─'.repeat(80));
    summary.forEach(c => {
      console.log(`${c.name.padEnd(20)} | Orders: ${c.total_orders} | Spent: ₹${c.total_spent.toFixed(2)} | Avg: ₹${c.average_order_value.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('Error during recalculation:', error);
  } finally {
    await db.close();
  }
}

recalculateAllCustomerMetrics();
