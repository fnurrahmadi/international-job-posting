import assert from "node:assert/strict";
import test from "node:test";
import { checkJobLink } from "../src/lib/jobs/link-health";

test("classifies live, missing, and generic redirects", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 200 });
    assert.equal(await checkJobLink("https://example.com/jobs/123"), "HEALTHY");
    globalThis.fetch = async () => new Response(null, { status: 404 });
    assert.equal(await checkJobLink("https://example.com/jobs/123"), "DEAD");
    globalThis.fetch = async () => Object.defineProperty(new Response(null, { status: 200 }), "url", { value: "https://example.com/" });
    assert.equal(await checkJobLink("https://example.com/jobs/123"), "DEAD");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
