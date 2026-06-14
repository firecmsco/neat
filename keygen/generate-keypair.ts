import { writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  // Generate ECDSA P-256 keypair
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true, // extractable
    ["sign", "verify"]
  );

  // Export keys as JWK
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  // Write private key to file
  const privateKeyPath = join(__dirname, "private-key.jwk.json");
  writeFileSync(privateKeyPath, JSON.stringify(privateJwk, null, 2) + "\n");
  console.log(`✅ Private key written to: ${privateKeyPath}`);

  // Ensure .gitignore exists and includes private key
  const gitignorePath = join(__dirname, ".gitignore");
  const gitignoreContent = "private-key.jwk.json\n";
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, gitignoreContent);
    console.log(`✅ Created .gitignore (ignoring private-key.jwk.json)`);
  }

  // Print public key for embedding in library
  console.log("\n📋 Public key JWK (paste into lib/license.ts):\n");
  console.log(JSON.stringify(publicJwk, null, 2));
}

main().catch((err) => {
  console.error("❌ Failed to generate keypair:", err);
  process.exit(1);
});
