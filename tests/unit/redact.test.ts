import { describe, it, expect, beforeEach } from "vitest";
import { redactSecrets, resetRedactionCounter } from "../../src/shared/redact";

const SECRETS = [
  { text: "key is sk-abcdefghijklmnopqrstuvwxyz1234567890", type: "openai_key" },
  { text: "use sk-ant-api03-abcdefghijklmnopqrstuvwxyz1234567890", type: "anthropic_key" },
  { text: "token ghp_abcdefghijklmnopqrstuvwxyz1234567890", type: "github_token" },
  { text: "slack xoxb-1234567890-1234567890-abcdefghijklmnopqrstuvwx", type: "slack_token" },
  { text: "aws AKIAIOSFODNN7EXAMPLE", type: "aws_key" },
  {
    text: "jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    type: "jwt",
  },
  { text: "password=supersecret123!", type: "password" },
  { text: "card 4111111111111111", type: "credit_card" },
  { text: "ssn 123-45-6789", type: "ssn" },
  { text: "email me at user@example.com", type: "email" },
  { text: "call 555-123-4567", type: "phone" },
  { text: "server 192.168.1.1", type: "ipv4" },
  {
    text: "secret AbCdEfGhIjKlMnOpQrStUvWxYz0123456789+/==",
    type: "high_entropy",
  },
];

const BENIGN = [
  "commit sha a1b2c3d4e5f6789012345678abcdef9012345678",
  "uuid 550e8400-e29b-41d4-a716-446655440000",
  "version 1.2.3",
  "file path /usr/local/bin/node",
  "hash deadbeef",
  "short token abc123",
  "number 123456789012345",
  "date 2024-01-15",
  "url https://example.com/page",
  "ip-like 1.2.3",
];

describe("redactSecrets", () => {
  beforeEach(() => resetRedactionCounter());

  it("catches all seeded secret formats", () => {
    for (const { text } of SECRETS) {
      const result = redactSecrets(text);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.redacted).not.toContain(
        text.includes("sk-") ? "sk-" : text.split(" ").pop()!
      );
    }
  });

  it("has at most 2 false positives on benign strings", () => {
    let falsePositives = 0;
    for (const text of BENIGN) {
      const result = redactSecrets(text);
      if (result.matches.length > 0) falsePositives++;
    }
    expect(falsePositives).toBeLessThanOrEqual(2);
  });

  it("produces redaction map for restoration", () => {
    const result = redactSecrets("my key sk-abcdefghijklmnopqrstuvwxyz1234567890 here");
    expect(Object.keys(result.map).length).toBeGreaterThan(0);
    expect(result.redacted).toContain("⟦REDACTED:");
  });
});
