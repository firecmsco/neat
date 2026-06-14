import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(args: string[]): { domain: string; email: string } {
  let domain: string | undefined;
  let email: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--domain" && args[i + 1]) {
      domain = args[++i];
    } else if (args[i] === "--email" && args[i + 1]) {
      email = args[++i];
    }
  }

  if (!domain || !email) {
    console.error("Usage: npm run sign -- --domain example.com --email user@example.com");
    process.exit(1);
  }

  return { domain, email };
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function main(): Promise<void> {
  const { domain, email } = parseArgs(process.argv.slice(2));

  // Read private key
  const privateKeyPath = join(__dirname, "private-key.jwk.json");
  let privateJwk: JsonWebKey;
  try {
    privateJwk = JSON.parse(readFileSync(privateKeyPath, "utf-8"));
  } catch {
    console.error("❌ Could not read private-key.jwk.json");
    console.error("   Run 'npm run generate-keypair' first.");
    process.exit(1);
  }

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create payload
  const payload = {
    domain,
    email,
    iat: Math.floor(Date.now() / 1000),
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBytes = new TextEncoder().encode(payloadJson);

  // Sign
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    payloadBytes
  );

  // Encode as base64url
  const payloadB64 = toBase64Url(payloadBytes.buffer);
  const signatureB64 = toBase64Url(signature);

  const licenseKey = `NEAT-${payloadB64}.${signatureB64}`;

  console.log("✅ License key generated!\n");
  console.log(`   Domain: ${domain}`);
  console.log(`   Email:  ${email}`);
  console.log(`   Issued: ${new Date(payload.iat * 1000).toISOString()}\n`);
  console.log(licenseKey);
}

main().catch((err) => {
  console.error("❌ Failed to sign license:", err);
  process.exit(1);
});
