/**
 * PostgresAdapter - PostgreSQL implementation of DatabaseAdapter
 * 
 * Uses node-pg for connection pooling and query execution.
 * Handles SQLite-to-Postgres query syntax conversion automatically.
 */

import pg from 'pg';
import { DatabaseAdapter } from '../DatabaseAdapter.js';

const { Pool } = pg;

export class PostgresAdapter extends DatabaseAdapter {
  constructor(poolInstance) {
    super();
    if (!poolInstance) {
      throw new Error('PostgresAdapter requires a Pool instance');
    }
    this.pool = poolInstance;
    this.dialect = 'postgres';
  }

  /**
   * Create a new PostgreSQL adapter from connection config
   * @param {Object} config - Database configuration
   * @param {string} config.connectionString - PostgreSQL connection string
   * @param {number} config.max - Maximum pool connections (default 20)
   * @param {number} config.idleTimeoutMillis - Idle timeout in ms (default 30000)
   * @param {number} config.connectionTimeoutMillis - Connection timeout in ms (default 2000)
   * @returns {PostgresAdapter}
   */
  static create(config = {}) {
    const defaultConfig = {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smb_app',
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false
    };

    const pool = new Pool(defaultConfig);
    return new PostgresAdapter(pool);
  }

  /**
   * Normalize SQLite-specific syntax to PostgreSQL
   * @private
   */
  _normalizeSql(sql) {
    // Convert INSERT OR IGNORE to ON CONFLICT DO NOTHING
    let normalized = sql.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT');
    
    if (/INSERT\s+OR\s+IGNORE/i.test(sql)) {
      const trimmed = normalized.trimEnd();
      const hasSemicolon = trimmed.endsWith(';');
      const base = hasSemicolon ? trimmed.slice(0, -1) : trimmed;
      normalized = `${base} ON CONFLICT DO NOTHING${hasSemicolon ? ';' : ''}`;
    }

    return normalized;
  }

  /**
   * Convert ? placeholders to numbered parameters ($1, $2, etc)
   * @private
   */
  _convertPlaceholders(sql) {
    let paramIndex = 0;
    return sql.replace(/\?/g, () => {
      paramIndex++;
      return `$${paramIndex}`;
    });
  }

  /**
   * Normalize parameter handling for consistency
   * @private
   */
  _normalizeParams(params) {
    if (!params || params.length === 0) return [];
    if (params.length === 1 && Array.isArray(params[0])) {
      return params[0];
    }
    return params;
  }

  /**
   * Prepare query for execution
   * @private
   */
  _prepareQuery(sql, params) {
    const normalized = this._normalizeSql(sql);
    const text = this._convertPlaceholders(normalized);
    const values = this._normalizeParams(params);
    return { text, values };
  }

  /**
   * Execute a query and return all results
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Array>}
   */
  async all(sql, ...params) {
    const { text, values } = this._prepareQuery(sql, params);
    const result = await this.pool.query(text, values);
    return result.rows;
  }

  /**
   * Execute a query and return first result
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object|null>}
   */
  async get(sql, ...params) {
    const { text, values } = this._prepareQuery(sql, params);
    const result = await this.pool.query(text, values);
    return result.rows[0] || null;
  }

  /**
   * Execute a write query (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object>} - { lastID, changes, rows }
   */
  async run(sql, ...params) {
    const { text, values } = this._prepareQuery(sql, params);
    const result = await this.pool.query(text, values);
    
    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount || 0,
      rows: result.rows
    };
  }

  /**
   * Execute a generic query
   * @param {string} sql - SQL query with ? placeholders
   * @param {...any} params - Query parameters
   * @returns {Promise<Object>}
   */
  async query(sql, ...params) {
    const { text, values } = this._prepareQuery(sql, params);
    return this.pool.query(text, values);
  }

  /**
   * Execute multiple SQL statements (used for migrations)
   * @param {string} sql - SQL batch with multiple statements
   * @returns {Promise<any>}
   */
  async exec(sql) {
    // PostgreSQL can execute batched commands separated by semicolons
    return this.pool.query(sql);
  }

  /**
   * Close the database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  /**
   * Get database type identifier
   * @returns {string}
   */
  getDialect() {
    return this.dialect;
  }

  /**
   * Get connection pool statistics
   * @returns {Object}
   */
  getPoolStats() {
    return {
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      total: this.pool.totalCount
    };
  }

  /**
   * Check if connection is alive
   * @returns {Promise<boolean>}
   */
  async isAlive() {
    try {
      await this.pool.query('SELECT 1');
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
    await this.pool.query('BEGIN');
  }

  /**
   * Commit transaction
   * @returns {Promise<void>}
   */
  async commit() {
    await this.pool.query('COMMIT');
  }

  /**
   * Rollback transaction
   * @returns {Promise<void>}
   */
  async rollback() {
    await this.pool.query('ROLLBACK');
  }
}
