/**
 * Database Module - Entry point for database access
 * 
 * This module provides backwards-compatible access to the database through
 * the PostgresAdapter. All application code uses getDb() which returns
 * an adapter instance that normalizes queries across the PostgreSQL database.
 * 
 * The adapter automatically handles:
 * - Placeholder conversion (? → $1, $2, etc)
 * - SQLite-to-Postgres syntax normalization (INSERT OR IGNORE → ON CONFLICT)
 * - Parameter array normalization
 */

import { PostgresAdapter } from './adapters/PostgresAdapter.js';

// Singleton adapter instance
let adapter;

/**
 * Get the database adapter instance
 * Uses lazy initialization for singleton pattern
 * 
 * @returns {PostgresAdapter} - Adapter instance for database operations
 * 
 * Usage:
 * ```javascript
 * const db = getDb();
 * const users = await db.all('SELECT * FROM users WHERE id = ?', userId);
 * const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
 * const result = await db.run('INSERT INTO users (name) VALUES (?)', name);
 * ```
 */
export function getDb() {
  if (!adapter) {
    adapter = PostgresAdapter.create();
  }
  return adapter;
}

/**
 * Initialize database adapter with custom config
 * Call this before getDb() to configure non-default settings
 * 
 * @param {Object} config - PostgreSQL configuration
 * @returns {PostgresAdapter}
 * 
 * Usage:
 * ```javascript
 * initDb({
 *   connectionString: 'postgresql://user:pass@host/db',
 *   max: 20,
 *   idleTimeoutMillis: 30000
 * });
 * ```
 */
export function initDb(config = {}) {
  adapter = PostgresAdapter.create(config);
  return adapter;
}

/**
 * Close the database connection
 * Call this during application shutdown
 * 
 * @returns {Promise<void>}
 */
export async function closeDb() {
  if (adapter) {
    await adapter.close();
    adapter = null;
  }
}
