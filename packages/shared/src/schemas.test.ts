import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPostSchema, loginSchema, registerSchema } from "./schemas.js";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = registerSchema.parse({
      email: "ada@openboard.dev",
      name: "Ada",
      password: "password1",
    });
    assert.equal(parsed.email, "ada@openboard.dev");
  });

  it("rejects a short password", () => {
    assert.throws(() =>
      registerSchema.parse({
        email: "ada@openboard.dev",
        name: "Ada",
        password: "short",
      }),
    );
  });
});

describe("loginSchema", () => {
  it("requires email", () => {
    assert.throws(() => loginSchema.parse({ email: "nope", password: "x" }));
  });
});

describe("createPostSchema", () => {
  it("trims title and body", () => {
    const parsed = createPostSchema.parse({
      title: "  Dark mode  ",
      body: "  Please add it.  ",
    });
    assert.equal(parsed.title, "Dark mode");
    assert.equal(parsed.body, "Please add it.");
  });
});
