import assert from "node:assert/strict";
import { test } from "node:test";
import { withBasePath, withoutBasePath, dashboardCallback } from "../lib/paths.ts";
const prefix = process.env.NEXT_PUBLIC_BASE_PATH || "";
test("preserves deployment prefix for assets and non-router redirects", () => {
  assert.equal(withBasePath("/login"), prefix + "/login");
  assert.equal(withBasePath("/logo.png"), prefix + "/logo.png");
  assert.equal(withoutBasePath(prefix + "/users"), "/users");
});
test("normalizes authentication callbacks without duplicating /admin", () => {
  assert.equal(dashboardCallback(prefix + "/users?page=2"), "/users?page=2");
  assert.equal(dashboardCallback(prefix || "/"), "/");
});
test("rejects external and out-of-dashboard callbacks", () => {
  for (const url of ["https://example.com", "//example.com", "/\\example.com", "/api/auth/error", "/users-malicious", null]) {
    assert.equal(dashboardCallback(url), "/");
  }
});
