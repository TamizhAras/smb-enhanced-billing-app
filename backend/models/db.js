import pg from 'pg';
const { Pool } = pg;

let pool;

const normalizeInsertIgnore = (sql) => {
  if (!/INSERT\s+OR\s+IGNORE/i.test(sql)) {
    return sql;
  }

  const withoutDirective = sql.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT');
  const trimmed = withoutDirective.trimEnd();
  const hasSemicolon = trimmed.endsWith(';');
  const base = hasSemicolon ? trimmed.slice(0, -1) : trimmed;
  return `${base} ON CONFLICT DO NOTHING${hasSemicolon ? ';' : ''}`;
};

const convertPlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
};

const normalizeParams = (params) => {
  if (!params || params.length === 0) return [];
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
};

const buildQuery = (sql, values) => {
  const normalized = normalizeInsertIgnore(sql);
  const text = convertPlaceholders(normalized);
  return { text, values };
};

const createDbAdapter = (poolInstance) => {
  const runQuery = async (sql, values = []) => {
    const { text, values: params } = buildQuery(sql, values);
    return poolInstance.query(text, params);
  };

  return {
    async run(sql, ...params) {
      const values = normalizeParams(params);
      return runQuery(sql, values);
    },
    async get(sql, ...params) {
      const values = normalizeParams(params);
      const result = await runQuery(sql, values);
      return result.rows[0] || null;
    },
    async all(sql, ...params) {
      const values = normalizeParams(params);
      const result = await runQuery(sql, values);
      return result.rows;
    },
    async exec(sql) {
      // For migration files containing multiple statements, rely on PostgreSQL's
      // ability to execute batched commands separated by semicolons.
      return poolInstance.query(sql);
    },
    async close() {
      // No-op: using a shared pool that stays alive for the app lifetime.
      return Promise.resolve();
    }
  };
};

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  return createDbAdapter(pool);
}
