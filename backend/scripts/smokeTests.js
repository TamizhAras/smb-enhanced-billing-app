import fetch from 'node-fetch';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.SMOKE_API_BASE || 'http://localhost:4000/api').replace(/\/$/, '');
const USERNAME = process.env.SMOKE_USERNAME || process.env.SMOKE_USER;
const PASSWORD = process.env.SMOKE_PASSWORD || process.env.SMOKE_PASS;

const REQUIRED_ENVS = ['API_BASE_URL', 'SMOKE_USERNAME', 'SMOKE_PASSWORD'];

const endpoints = [
  { name: 'Health check', path: '/health', method: 'GET', auth: false, transformUrl: (base) => base.replace(/\/api$/, '') + '/health' },
  { name: 'Invoices list', path: '/invoices', method: 'GET', auth: true },
  { name: 'Customers list', path: '/customers', method: 'GET', auth: true },
  { name: 'Inventory list', path: '/inventory', method: 'GET', auth: true }
];

const ms = (start) => `${Date.now() - start}ms`;

const assertConfig = () => {
  if (!USERNAME || !PASSWORD) {
    const missing = REQUIRED_ENVS.filter((key) => {
      if (key === 'API_BASE_URL') return !API_BASE_URL;
      if (key === 'SMOKE_USERNAME') return !USERNAME;
      if (key === 'SMOKE_PASSWORD') return !PASSWORD;
      return false;
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const login = async () => {
  const url = `${API_BASE_URL}/auth/login`;
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log(`✓ Login succeeded in ${ms(start)} for tenant ${data?.user?.tenantId}`);
  return data;
};

const hitEndpoint = async ({ name, path, method, auth, transformUrl }, token) => {
  const endpointUrl = transformUrl ? transformUrl(API_BASE_URL) : `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    if (!token) throw new Error('Auth token missing for protected endpoint');
    headers.Authorization = `Bearer ${token}`;
  }
  const start = Date.now();
  const res = await fetch(endpointUrl, { method: method || 'GET', headers });
  const text = await res.text();
  const duration = ms(start);
  const ok = res.ok;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  if (ok) {
    const count = parsed?.data?.length ?? (Array.isArray(parsed) ? parsed.length : undefined);
    console.log(`✓ ${name} (${res.status}) in ${duration}${typeof count === 'number' ? ` | items: ${count}` : ''}`);
  } else {
    console.error(`✗ ${name} failed (${res.status}) in ${duration}`);
    console.error(parsed);
  }

  return ok;
};

async function main() {
  try {
    assertConfig();
    const loginResponse = await login();
    const token = loginResponse.token;

    const results = await Promise.all(
      endpoints.map((endpoint) => hitEndpoint(endpoint, token))
    );

    const success = results.every(Boolean);
    if (!success) {
      console.error('\nSmoke tests failed');
      process.exitCode = 1;
    } else {
      console.log('\nAll smoke tests passed');
    }
  } catch (error) {
    console.error('Smoke test error:', error.message);
    process.exitCode = 1;
  }
}

main();
