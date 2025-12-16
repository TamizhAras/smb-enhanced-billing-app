/**
 * Adapter Unit Tests
 * 
 * Comprehensive test suite for DatabaseAdapter and PostgresAdapter
 * Run with: npm test backend/tests/adapter.test.js
 */

import assert from 'assert';
import { QueryBuilder } from '../models/QueryBuilder.js';
import { DatabaseAdapter } from '../models/DatabaseAdapter.js';
import { PostgresAdapter } from '../models/adapters/PostgresAdapter.js';

/**
 * Mock Pool for testing without real database
 */
class MockPool {
  constructor() {
    this.queries = [];
    this.idleCount = 5;
    this.waitingCount = 0;
    this.totalCount = 20;
  }

  async query(text, values = []) {
    this.queries.push({ text, values });
    return {
      rows: [{ id: 1, name: 'Test' }],
      rowCount: 1
    };
  }

  async end() {
    // Noop
  }
}

/**
 * Test Suite: QueryBuilder
 */
describe('QueryBuilder', () => {
  describe('SELECT queries', () => {
    it('should build simple SELECT', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('id', 'name')
        .from('users')
        .toQuery();

      assert.strictEqual(sql, 'SELECT id, name FROM users');
      assert.deepStrictEqual(values, []);
    });

    it('should build SELECT with WHERE', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('*')
        .from('users')
        .where('status = ?', 'active')
        .toQuery();

      assert.strictEqual(sql, 'SELECT * FROM users WHERE (status = $1)');
      assert.deepStrictEqual(values, ['active']);
    });

    it('should build SELECT with multiple WHERE conditions', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('*')
        .from('users')
        .where('status = ?', 'active')
        .and('age > ?', 18)
        .toQuery();

      assert.strictEqual(sql, 'SELECT * FROM users WHERE (status = $1) AND (age > $2)');
      assert.deepStrictEqual(values, ['active', 18]);
    });

    it('should build SELECT with ORDER BY and LIMIT', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('*')
        .from('users')
        .orderBy('created_at', 'DESC')
        .limit(10)
        .toQuery();

      assert.strictEqual(sql, 'SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
      assert.deepStrictEqual(values, []);
    });

    it('should build SELECT with JOINs', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('u.id', 'u.name', 'o.total')
        .from('users', 'u')
        .innerJoin('orders o', 'o.user_id = u.id')
        .where('u.status = ?', 'active')
        .toQuery();

      assert(sql.includes('INNER JOIN orders'));
      assert.deepStrictEqual(values, ['active']);
    });

    it('should build SELECT with GROUP BY and HAVING', () => {
      const qb = new QueryBuilder('postgres');
      const { sql, values } = qb
        .select('user_id', 'COUNT(*) as count')
        .from('orders')
        .groupBy('user_id')
        .having('COUNT(*) > ?', 5)
        .toQuery();

      assert(sql.includes('GROUP BY user_id'));
      assert(sql.includes('HAVING COUNT(*) > $1'));
      assert.deepStrictEqual(values, [5]);
    });

    it('should build SELECT with OFFSET', () => {
      const qb = new QueryBuilder('postgres');
      const { sql } = qb
        .select('*')
        .from('users')
        .limit(10)
        .offset(20)
        .toQuery();

      assert(sql.includes('LIMIT 10'));
      assert(sql.includes('OFFSET 20'));
    });

    it('should throw error on SELECT without FROM', () => {
      const qb = new QueryBuilder('postgres');
      assert.throws(() => {
        qb.select('*').toQuery();
      });
    });

    it('should throw error on invalid LIMIT', () => {
      const qb = new QueryBuilder('postgres');
      assert.throws(() => {
        qb.limit(-1);
      });
    });

    it('should allow method chaining', () => {
      const qb = new QueryBuilder('postgres');
      const result = qb
        .select('*')
        .from('users')
        .where('id = ?', 1)
        .and('status = ?', 'active')
        .orderBy('created_at', 'DESC')
        .limit(10);

      assert(result instanceof QueryBuilder);
    });
  });

  describe('INSERT queries', () => {
    it('should build INSERT query', () => {
      const { sql, values } = QueryBuilder.insert('users', {
        name: 'John',
        email: 'john@example.com'
      });

      assert(sql.includes('INSERT INTO users'));
      assert.deepStrictEqual(values, ['John', 'john@example.com']);
    });

    it('should build INSERT with ON CONFLICT IGNORE for Postgres', () => {
      const { sql } = QueryBuilder.insert('users', {
        email: 'john@example.com'
      }, {
        dialect: 'postgres',
        onConflict: 'ignore'
      });

      assert(sql.includes('ON CONFLICT DO NOTHING'));
    });

    it('should build INSERT with ON CONFLICT UPDATE for Postgres', () => {
      const { sql } = QueryBuilder.insert('users', {
        email: 'john@example.com',
        name: 'John'
      }, {
        dialect: 'postgres',
        onConflict: 'update',
        conflictColumn: 'email'
      });

      assert(sql.includes('ON CONFLICT'));
      assert(sql.includes('DO UPDATE SET'));
    });
  });

  describe('UPDATE queries', () => {
    it('should build UPDATE query', () => {
      const { sql, values } = QueryBuilder.update('users', {
        name: 'Jane',
        status: 'active'
      }, 'id = ?', 1);

      assert(sql.includes('UPDATE users SET'));
      assert.deepStrictEqual(values, ['Jane', 'active', 1]);
    });
  });

  describe('DELETE queries', () => {
    it('should build DELETE query', () => {
      const { sql, values } = QueryBuilder.delete('users', 'status = ?', 'inactive');

      assert(sql.includes('DELETE FROM users'));
      assert.deepStrictEqual(values, ['inactive']);
    });
  });

  describe('Builder utilities', () => {
    it('should reset builder state', () => {
      const qb = new QueryBuilder('postgres');
      qb.select('*').from('users').where('id = ?', 1);
      qb.reset();

      assert.deepStrictEqual(qb.clauses.select, []);
      assert.strictEqual(qb.clauses.from, null);
      assert.deepStrictEqual(qb.values, []);
    });

    it('should clone builder', () => {
      const qb1 = new QueryBuilder('postgres');
      qb1.select('*').from('users').where('id = ?', 1);
      
      const qb2 = qb1.clone();
      qb2.and('status = ?', 'active');

      const { sql: sql1 } = qb1.toQuery();
      const { sql: sql2 } = qb2.toQuery();

      assert(sql1.includes('id = $1'));
      assert(!sql1.includes('status'));
      assert(sql2.includes('status = $2'));
    });

    it('should provide debug output', () => {
      const qb = new QueryBuilder('postgres');
      const str = qb
        .select('*')
        .from('users')
        .where('id = ?', 1)
        .toString();

      assert(str.includes('SQL:'));
      assert(str.includes('SELECT'));
    });
  });
});

/**
 * Test Suite: DatabaseAdapter
 */
describe('DatabaseAdapter', () => {
  it('should define interface methods', () => {
    const adapter = new DatabaseAdapter();
    const methods = ['all', 'get', 'run', 'query', 'exec', 'close', 'getDialect', 'isAlive'];

    methods.forEach(method => {
      assert(typeof adapter[method] === 'function');
    });
  });

  it('should throw NotImplementedError for abstract methods', async () => {
    const adapter = new DatabaseAdapter();

    for (const method of ['all', 'get', 'run', 'query', 'exec', 'close']) {
      try {
        await adapter[method]('SELECT 1');
        assert.fail(`${method} should throw`);
      } catch (err) {
        assert(err.message.includes('must be implemented'));
      }
    }
  });

  it('should support transactions', async () => {
    const adapter = new DatabaseAdapter();
    assert(typeof adapter.transaction === 'function');
    assert(typeof adapter.beginTransaction === 'function');
    assert(typeof adapter.commit === 'function');
    assert(typeof adapter.rollback === 'function');
  });
});

/**
 * Test Suite: PostgresAdapter
 */
describe('PostgresAdapter', () => {
  describe('Initialization', () => {
    it('should create adapter with mock pool', () => {
      const mockPool = new MockPool();
      const adapter = new PostgresAdapter(mockPool);

      assert.strictEqual(adapter.getDialect(), 'postgres');
      assert(adapter.pool === mockPool);
    });

    it('should throw error without pool', () => {
      assert.throws(() => {
        new PostgresAdapter(null);
      });
    });

    it('should create adapter via factory method', () => {
      // Note: This would require DATABASE_URL env var in real scenario
      // For testing, we're testing the factory method exists
      assert(typeof PostgresAdapter.create === 'function');
    });
  });

  describe('Query preparation', () => {
    let adapter;

    beforeEach(() => {
      adapter = new PostgresAdapter(new MockPool());
    });

    it('should normalize INSERT OR IGNORE to ON CONFLICT', () => {
      const sql = 'INSERT OR IGNORE INTO users (name) VALUES (?)';
      const normalized = adapter._normalizeSql(sql);

      assert(normalized.includes('ON CONFLICT'));
      assert(!normalized.includes('OR IGNORE'));
    });

    it('should convert ? placeholders to $1, $2, etc', () => {
      const sql = 'SELECT * FROM users WHERE id = ? AND status = ?';
      const converted = adapter._convertPlaceholders(sql);

      assert.strictEqual(converted, 'SELECT * FROM users WHERE id = $1 AND status = $2');
    });

    it('should normalize parameter arrays', () => {
      const params1 = adapter._normalizeParams([1, 2, 3]);
      const params2 = adapter._normalizeParams([[1, 2, 3]]);

      assert.deepStrictEqual(params1, [1, 2, 3]);
      assert.deepStrictEqual(params2, [1, 2, 3]);
    });

    it('should prepare complete query', () => {
      const { text, values } = adapter._prepareQuery(
        'INSERT OR IGNORE INTO users (name) VALUES (?)',
        ['John']
      );

      assert(text.includes('ON CONFLICT'));
      assert(text.includes('$1'));
      assert.deepStrictEqual(values, ['John']);
    });
  });

  describe('Query execution', () => {
    let adapter;

    beforeEach(() => {
      adapter = new PostgresAdapter(new MockPool());
    });

    it('should execute all() query', async () => {
      const rows = await adapter.all('SELECT * FROM users');
      assert(Array.isArray(rows));
    });

    it('should execute get() query', async () => {
      const row = await adapter.get('SELECT * FROM users WHERE id = ?', 1);
      assert(typeof row === 'object');
    });

    it('should execute run() query', async () => {
      const result = await adapter.run('INSERT INTO users (name) VALUES (?)', 'John');
      assert(typeof result.changes === 'number');
    });

    it('should execute query() with all results', async () => {
      const result = await adapter.query('SELECT * FROM users');
      assert(result.rows);
    });
  });

  describe('Pool management', () => {
    let adapter;

    beforeEach(() => {
      adapter = new PostgresAdapter(new MockPool());
    });

    it('should report pool stats', () => {
      const stats = adapter.getPoolStats();
      assert(stats.idle !== undefined);
      assert(stats.waiting !== undefined);
      assert(stats.total !== undefined);
    });

    it('should have close method', async () => {
      // Mock close should not throw
      await adapter.close();
    });
  });

  describe('Parameter handling variations', () => {
    let adapter;

    beforeEach(() => {
      adapter = new PostgresAdapter(new MockPool());
    });

    it('should handle variadic parameters', async () => {
      await adapter.all('SELECT * FROM users WHERE id = ?', 123);
      // Should not throw
    });

    it('should handle array parameters', async () => {
      await adapter.all('SELECT * FROM users WHERE id = ?', [123]);
      // Should not throw
    });

    it('should handle multiple parameters', async () => {
      await adapter.all('SELECT * FROM users WHERE id = ? AND status = ?', 123, 'active');
      // Should not throw
    });
  });
});

/**
 * Integration Tests
 * (Only run these if you have a test database configured)
 */
describe('Integration Tests (requires DATABASE_URL)', function() {
  this.timeout(10000);

  let adapter;

  before(async function() {
    if (!process.env.DATABASE_URL) {
      this.skip();
    }

    adapter = PostgresAdapter.create({
      connectionString: process.env.DATABASE_URL + '_test',
      max: 5
    });
  });

  after(async function() {
    if (adapter) {
      await adapter.close();
    }
  });

  it('should connect to database', async () => {
    const alive = await adapter.isAlive();
    assert(alive);
  });

  it('should execute simple query', async () => {
    const result = await adapter.all('SELECT 1 as test');
    assert(result.length > 0);
  });
});

/**
 * Test Runner
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Running Adapter Tests\n');

  const tests = [
    { name: 'QueryBuilder', fn: testQueryBuilder },
    { name: 'DatabaseAdapter', fn: testDatabaseAdapter },
    { name: 'PostgresAdapter', fn: testPostgresAdapter }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📝 ${test.name}`);
    try {
      test.fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.error('❌ FAILED:', err.message);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

export { QueryBuilder, DatabaseAdapter, PostgresAdapter };
