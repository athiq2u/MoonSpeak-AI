import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../server.js";

async function withServer(run) {
  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("GET /healthz returns status ok and check booleans", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.status, "ok");
    assert.equal(typeof data.checks.murfConfigured, "boolean");
    assert.equal(typeof data.checks.aiConfigured, "boolean");
  });
});

test("GET / returns API status payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);

    const data = await response.json();
    assert.equal(data.status, "ok");
    assert.equal(typeof data.message, "string");
  });
});
