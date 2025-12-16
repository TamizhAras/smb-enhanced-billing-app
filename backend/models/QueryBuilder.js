/**
 * QueryBuilder - Formal query construction for database operations
 * 
 * Provides a type-safe interface for building SQL queries with consistent
 * parameter handling across different database systems.
 * 
 * Supports:
 * - SELECT with WHERE, ORDER BY, LIMIT, OFFSET
 * - INSERT with conflict handling
 * - UPDATE with WHERE conditions
 * - DELETE with WHERE conditions
 * - JOIN operations
 * - Aggregations
 */

export class QueryBuilder {
  constructor(dialect = 'postgres') {
    this.dialect = dialect; // 'postgres', 'mysql', 'sqlite', 'mssql'
    this.clauses = {
      select: [],
      from: null,
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: null,
      offset: null
    };
    this.values = [];
    this.parameterIndex = 0;
  }

  /**
   * Add SELECT columns
   * @param {...string} columns - Column names or expressions
   * @returns {QueryBuilder} - For method chaining
   */
  select(...columns) {
    this.clauses.select = columns.length ? columns : ['*'];
    return this;
  }

  /**
   * Set FROM table
   * @param {string} table - Table name
   * @param {string} alias - Optional table alias
   * @returns {QueryBuilder}
   */
  from(table, alias = null) {
    this.clauses.from = alias ? `${table} AS ${alias}` : table;
    return this;
  }

  /**
   * Add INNER JOIN
   * @param {string} table - Table to join
   * @param {string} on - Join condition
   * @param {string} alias - Optional table alias
   * @returns {QueryBuilder}
   */
  innerJoin(table, on, alias = null) {
    const tableClause = alias ? `${table} AS ${alias}` : table;
    this.clauses.joins.push(`INNER JOIN ${tableClause} ON ${on}`);
    return this;
  }

  /**
   * Add LEFT JOIN
   * @param {string} table - Table to join
   * @param {string} on - Join condition
   * @param {string} alias - Optional table alias
   * @returns {QueryBuilder}
   */
  leftJoin(table, on, alias = null) {
    const tableClause = alias ? `${table} AS ${alias}` : table;
    this.clauses.joins.push(`LEFT JOIN ${tableClause} ON ${on}`);
    return this;
  }

  /**
   * Add WHERE condition
   * @param {string} condition - WHERE clause (use ? for parameters)
   * @param {*} values - Parameter values
   * @returns {QueryBuilder}
   */
  where(condition, ...values) {
    if (values.length > 0) {
      this.values.push(...values);
      const parameterizedCondition = this._convertPlaceholders(condition);
      this.clauses.where.push(`(${parameterizedCondition})`);
    } else {
      this.clauses.where.push(`(${condition})`);
    }
    return this;
  }

  /**
   * Add AND condition (chainable WHERE)
   * @param {string} condition - AND clause
   * @param {*} values - Parameter values
   * @returns {QueryBuilder}
   */
  and(condition, ...values) {
    return this.where(condition, ...values);
  }

  /**
   * Add OR condition
   * @param {string} condition - OR clause
   * @param {*} values - Parameter values
   * @returns {QueryBuilder}
   */
  or(condition, ...values) {
    if (this.clauses.where.length === 0) {
      return this.where(condition, ...values);
    }
    if (values.length > 0) {
      this.values.push(...values);
      const parameterizedCondition = this._convertPlaceholders(condition);
      // Modify last WHERE to be OR'd
      const lastWhere = this.clauses.where.pop();
      this.clauses.where.push(`${lastWhere} OR (${parameterizedCondition})`);
    } else {
      const lastWhere = this.clauses.where.pop();
      this.clauses.where.push(`${lastWhere} OR (${condition})`);
    }
    return this;
  }

  /**
   * Add GROUP BY
   * @param {...string} columns - Columns to group by
   * @returns {QueryBuilder}
   */
  groupBy(...columns) {
    this.clauses.groupBy.push(...columns);
    return this;
  }

  /**
   * Add HAVING condition
   * @param {string} condition - HAVING clause
   * @param {*} values - Parameter values
   * @returns {QueryBuilder}
   */
  having(condition, ...values) {
    if (values.length > 0) {
      this.values.push(...values);
      const parameterizedCondition = this._convertPlaceholders(condition);
      this.clauses.having.push(parameterizedCondition);
    } else {
      this.clauses.having.push(condition);
    }
    return this;
  }

  /**
   * Add ORDER BY
   * @param {string} column - Column name
   * @param {string} direction - 'ASC' or 'DESC'
   * @returns {QueryBuilder}
   */
  orderBy(column, direction = 'ASC') {
    direction = direction.toUpperCase();
    if (!['ASC', 'DESC'].includes(direction)) {
      throw new Error('Invalid ORDER BY direction. Use ASC or DESC.');
    }
    this.clauses.orderBy.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add LIMIT
   * @param {number} count - Limit count
   * @returns {QueryBuilder}
   */
  limit(count) {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('LIMIT must be a non-negative number');
    }
    this.clauses.limit = count;
    return this;
  }

  /**
   * Add OFFSET
   * @param {number} count - Offset count
   * @returns {QueryBuilder}
   */
  offset(count) {
    if (typeof count !== 'number' || count < 0) {
      throw new Error('OFFSET must be a non-negative number');
    }
    this.clauses.offset = count;
    return this;
  }

  /**
   * Build SELECT query
   * @returns {Object} - { sql, values }
   */
  toSelectQuery() {
    if (!this.clauses.from) {
      throw new Error('SELECT query must have a FROM clause');
    }

    const parts = [
      `SELECT ${this.clauses.select.join(', ')}`,
      `FROM ${this.clauses.from}`
    ];

    if (this.clauses.joins.length > 0) {
      parts.push(this.clauses.joins.join(' '));
    }

    if (this.clauses.where.length > 0) {
      parts.push(`WHERE ${this.clauses.where.join(' AND ')}`);
    }

    if (this.clauses.groupBy.length > 0) {
      parts.push(`GROUP BY ${this.clauses.groupBy.join(', ')}`);
    }

    if (this.clauses.having.length > 0) {
      parts.push(`HAVING ${this.clauses.having.join(' AND ')}`);
    }

    if (this.clauses.orderBy.length > 0) {
      parts.push(`ORDER BY ${this.clauses.orderBy.join(', ')}`);
    }

    if (this.clauses.limit !== null) {
      parts.push(`LIMIT ${this.clauses.limit}`);
    }

    if (this.clauses.offset !== null) {
      parts.push(`OFFSET ${this.clauses.offset}`);
    }

    const sql = parts.join(' ');
    return { sql, values: this.values };
  }

  /**
   * Build INSERT query
   * @param {string} table - Table name
   * @param {Object} values - Column values
   * @param {Object} options - { onConflict: 'ignore' | 'update' }
   * @returns {Object} - { sql, values }
   */
  static insert(table, values, options = {}) {
    const columns = Object.keys(values);
    const placeholders = columns.map(() => '?').join(', ');
    const vals = Object.values(values);

    let sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (options.onConflict === 'ignore') {
      if (options.dialect === 'sqlite') {
        sql = sql.replace('INSERT', 'INSERT OR IGNORE');
      } else if (options.dialect === 'postgres') {
        sql += ' ON CONFLICT DO NOTHING';
      } else if (options.dialect === 'mysql') {
        sql += ' ON DUPLICATE KEY UPDATE ' + columns.map(col => `${col}=VALUES(${col})`).join(', ');
      }
    } else if (options.onConflict === 'update') {
      const updateParts = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
      sql += ` ON CONFLICT (${options.conflictColumn || 'id'}) DO UPDATE SET ${updateParts}`;
    }

    return { sql, values: vals };
  }

  /**
   * Build UPDATE query
   * @param {string} table - Table name
   * @param {Object} values - Columns to update
   * @param {string} whereClause - WHERE condition
   * @param {*} whereValues - WHERE values
   * @returns {Object} - { sql, values }
   */
  static update(table, values, whereClause, ...whereValues) {
    const columns = Object.keys(values);
    const setClause = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
    const vals = Object.values(values);

    const whereParams = columns.length + 1;
    let parameterizedWhere = whereClause;
    let paramIdx = whereParams;

    // Convert ? to numbered parameters for WHERE
    parameterizedWhere = whereClause.replace(/\?/g, () => `$${paramIdx++}`);

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${parameterizedWhere}`;

    return { sql, values: [...vals, ...whereValues] };
  }

  /**
   * Build DELETE query
   * @param {string} table - Table name
   * @param {string} whereClause - WHERE condition
   * @param {*} whereValues - WHERE values
   * @returns {Object} - { sql, values }
   */
  static delete(table, whereClause, ...whereValues) {
    const parameterizedWhere = whereClause.replace(/\?/g, () => {
      return `$${whereValues.indexOf(whereValues[whereValues.indexOf(whereValues)]) + 1}`;
    });

    const sql = `DELETE FROM ${table} WHERE ${parameterizedWhere}`;
    return { sql, values: whereValues };
  }

  /**
   * Convert ? placeholders to numbered parameters ($1, $2, etc) for Postgres
   * @private
   */
  _convertPlaceholders(sql) {
    const startIndex = this.values.length + 1;
    let index = startIndex;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Get final SQL with all parameters
   * @returns {Object} - { sql, values }
   */
  toQuery() {
    return this.toSelectQuery();
  }

  /**
   * Reset builder for reuse
   * @returns {QueryBuilder}
   */
  reset() {
    this.clauses = {
      select: [],
      from: null,
      joins: [],
      where: [],
      groupBy: [],
      having: [],
      orderBy: [],
      limit: null,
      offset: null
    };
    this.values = [];
    this.parameterIndex = 0;
    return this;
  }

  /**
   * Clone builder for independent operations
   * @returns {QueryBuilder}
   */
  clone() {
    const cloned = new QueryBuilder(this.dialect);
    cloned.clauses = JSON.parse(JSON.stringify(this.clauses));
    cloned.values = [...this.values];
    cloned.parameterIndex = this.parameterIndex;
    return cloned;
  }

  /**
   * Debug output
   */
  toString() {
    try {
      const { sql, values } = this.toQuery();
      return `SQL: ${sql}\nValues: ${JSON.stringify(values)}`;
    } catch (err) {
      return `[Invalid query: ${err.message}]`;
    }
  }
}
