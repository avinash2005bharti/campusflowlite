import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

describe('HTTP & Health Acceptance Check', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/v1/health should return 200 OK with expected JSON structure', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'CampusFlow Lite API');
    assert.ok(body.timestamp);
  });

  it('GET non-existent endpoint should return 404 with standardized error JSON', async () => {
    const res = await fetch(`${baseUrl}/api/v1/non-existent-route-xyz`);
    assert.equal(res.status, 404);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
