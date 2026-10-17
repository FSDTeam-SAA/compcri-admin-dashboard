import assert from "node:assert/strict";
import { test } from "node:test";
import { AxiosError } from "axios";
import { loginErrorMessage } from "../lib/auth-errors.ts";

const httpError = (status, code) => Object.assign(new AxiosError("Internal response details"), {
  response: { status, data: { error: { code, message: "Internal response details" } } },
});

test("distinguishes an unreachable or timed-out server from invalid credentials", () => {
  assert.equal(loginErrorMessage(new AxiosError("connect ECONNREFUSED", "ECONNREFUSED")), "Cannot reach the authentication server. Please try again.");
  assert.equal(loginErrorMessage(new AxiosError("timeout", "ECONNABORTED")), "The sign-in request timed out. Please try again.");
  assert.equal(loginErrorMessage(httpError(401, "INVALID_CREDENTIALS")), "Email or password is incorrect.");
});
test("reports server failures without exposing internal response details", () => {
  assert.equal(loginErrorMessage(httpError(503, "DATABASE_ERROR")), "The authentication server is temporarily unavailable. Please try again later.");
  assert.equal(loginErrorMessage(new Error("private credentials")), "Sign in could not be completed. Please try again.");
});
test("preserves actionable account, validation, and rate-limit errors", () => {
  assert.equal(loginErrorMessage(httpError(403, "ACCOUNT_SUSPENDED")), "Your account is suspended. Contact your administrator.");
  assert.equal(loginErrorMessage(httpError(403, "ACCOUNT_PENDING_DELETION")), "Your account is pending deletion. Contact your administrator.");
  assert.equal(loginErrorMessage(httpError(403, "ROLE_FORBIDDEN")), "This account does not have administrator access.");
  assert.equal(loginErrorMessage(httpError(429)), "Too many sign-in attempts. Please try again later.");
  assert.equal(loginErrorMessage(httpError(422)), "Please enter a valid email address and password.");
});
