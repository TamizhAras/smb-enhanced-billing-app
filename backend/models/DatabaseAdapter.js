/**
 * DatabaseAdapter Interface
 * 
 * Defines the contract that all database adapters must implement.
 * This enables support for multiple database systems (PostgreSQL, MySQL, SQLite, MSSQL)
 * with a consistent API throughout the application.
 * 
 * Core Principles:
 * 1. Consistent parameter handling across databases
 * 2. Automatic placeholder normalization (? → $1, :param, etc)
 * 3. Cross-database query compatibility
 * 4. Connection pooling & lifecycle management
 */

export class DatabaseAdapter {
  /**
   * Execute a query and return all results
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Array>} - Array of result rows
   */
  async all(sql, ...params) {
    throw new Error('DatabaseAdapter.all() must be implemented by subclass');
  }

  /**
   * Execute a query and return first result
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object|null>} - First row or null
   */
  async get(sql, ...params) {
    throw new Error('DatabaseAdapter.get() must be implemented by subclass');
  }

  /**
   * Execute a write query (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object>} - { lastID, changes, rows }
   */
  async run(sql, ...params) {
    throw new Error('DatabaseAdapter.run() must be implemented by subclass');
  }

  /**
   * Execute a generic query
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object>} - Database-specific result object
   */
  async query(sql, ...params) {
    throw new Error('DatabaseAdapter.query() must be implemented by subclass');
  }

  /**
   * Execute multiple SQL statements (used for migrations)
   * Typically used for files containing multiple statements separated by semicolons
   * @param {string} sql - SQL batch with multiple statements
   * @returns {Promise<any>} - Execution result
   */
  async exec(sql) {
    throw new Error('DatabaseAdapter.exec() must be implemented by subclass');
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('DatabaseAdapter.close() must be implemented by subclass');
  }

  /**
   * Get database type identifier
   * @returns {string} - 'postgres', 'mysql', 'sqlite', 'mssql', etc
   */
  getDialect() {
    throw new Error('DatabaseAdapter.getDialect() must be implemented by subclass');
  }

  /**
   * Get current connection pool stats (if available)
   * @returns {Object} - { idle, waiting, total } or null if not applicable
   */
  getPoolStats() {
    return null;
  }

  /**
   * Check if connection is alive
   * @returns {Promise<boolean>}
   */
  async isAlive() {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Begin transaction
   * @returns {Promise<void>}
   */
  async beginTransaction() {
    await this.run('BEGIN');
  }

  /**
   * Commit transaction
   * @returns {Promise<void>}
   */
  async commit() {
    await this.run('COMMIT');
  }

  /**
   * Rollback transaction
   * @returns {Promise<void>}
   */
  async rollback() {
    await this.run('ROLLBACK');
  }

  /**
   * Execute callback within a transaction
   * Automatically commits on success, rolls back on error
   * @param {Function} callback - Async function to execute within transaction
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    await this.beginTransaction();
    try {
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
