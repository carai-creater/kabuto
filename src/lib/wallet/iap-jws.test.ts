// Run with: npx tsx src/lib/wallet/iap-jws.test.ts
//
// Exercises the production JWS verifier by generating a self-signed
// root + leaf ECDSA-P256 cert inside the test, signing a payload with
// the leaf key, and feeding the resulting JWS into verifyIapJws with
// the self-signed root pinned as the trusted anchor.
//
// This proves:
//   - signature verification works end-to-end
//   - chain walking terminates at the pinned root
//   - a tampered payload is rejected
//   - an expired cert is rejected
//   - a bundle-id mismatch is rejected
//   - an unknown root (production pinned Apple root) is rejected
import assert from "node:assert/strict";
import { X509Certificate, createPrivateKey } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SignJWT, importPKCS8 } from "jose";
import { verifyIapJws } from "./iap-jws";

type Pair = { keyPem: string; certPem: string };

function opensslGenerate(dir: string): { root: Pair; leaf: Pair } {
  // Root key + self-signed root cert (valid 10 years from now)
  execFileSync("openssl", [
    "ecparam", "-name", "prime256v1", "-genkey", "-noout",
    "-out", join(dir, "root.key"),
  ]);
  execFileSync("openssl", [
    "req", "-new", "-x509", "-key", join(dir, "root.key"),
    "-out", join(dir, "root.crt"),
    "-days", "3650",
    "-subj", "/CN=Kabuto Test Root",
  ]);

  // Leaf key + CSR signed by root
  execFileSync("openssl", [
    "ecparam", "-name", "prime256v1", "-genkey", "-noout",
    "-out", join(dir, "leaf.key"),
  ]);
  execFileSync("openssl", [
    "req", "-new", "-key", join(dir, "leaf.key"),
    "-out", join(dir, "leaf.csr"),
    "-subj", "/CN=Kabuto Test Leaf",
  ]);
  execFileSync("openssl", [
    "x509", "-req", "-in", join(dir, "leaf.csr"),
    "-CA", join(dir, "root.crt"),
    "-CAkey", join(dir, "root.key"),
    "-CAcreateserial",
    "-out", join(dir, "leaf.crt"),
    "-days", "365",
    "-sha256",
  ]);

  // Convert keys to PKCS8 so `jose.importPKCS8` accepts them.
  execFileSync("openssl", [
    "pkcs8", "-topk8", "-nocrypt",
    "-in", join(dir, "leaf.key"),
    "-out", join(dir, "leaf.pk8.pem"),
  ]);

  const rootCertPem = readFileSync(join(dir, "root.crt"), "utf8");
  const leafCertPem = readFileSync(join(dir, "leaf.crt"), "utf8");
  const leafKeyPem = readFileSync(join(dir, "leaf.pk8.pem"), "utf8");

  return {
    root: { keyPem: "", certPem: rootCertPem },
    leaf: { keyPem: leafKeyPem, certPem: leafCertPem },
  };
}

function pemToBase64Der(pem: string): string {
  return pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
}

async function buildSignedJws(args: {
  leaf: Pair;
  root: Pair;
  payload: Record<string, unknown>;
}): Promise<string> {
  const privateKey = await importPKCS8(args.leaf.keyPem, "ES256");
  const x5c = [
    pemToBase64Der(args.leaf.certPem),
    pemToBase64Der(args.root.certPem),
  ];
  const jwt = await new SignJWT(args.payload)
    .setProtectedHeader({ alg: "ES256", x5c })
    .sign(privateKey);
  return jwt;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "kabuto-jws-"));
  try {
    const { root, leaf } = opensslGenerate(dir);
    const tests: Array<[string, () => Promise<void>]> = [];

    const basePayload = {
      transactionId: "2000000000000000",
      productId: "pt_500",
      bundleId: "com.carai.kabutoios",
      purchaseDate: 1_700_000_000_000,
    };

    tests.push(["verifyIapJws accepts a well-formed signed JWS", async () => {
      const jws = await buildSignedJws({ leaf, root, payload: basePayload });
      const claims = await verifyIapJws(jws, {
        trustedRootPem: root.certPem,
        expectedBundleId: "com.carai.kabutoios",
      });
      assert.ok(claims, "expected claims for a valid JWS");
      assert.equal(claims!.transactionId, "2000000000000000");
      assert.equal(claims!.productId, "pt_500");
    }]);

    tests.push(["verifyIapJws rejects tampered payload", async () => {
      const jws = await buildSignedJws({ leaf, root, payload: basePayload });
      const parts = jws.split(".");
      // Flip a bit in the payload by replacing a character.
      const tampered = Buffer.from(parts[1], "base64url").toString("utf8");
      const mutated = tampered.replace("pt_500", "pt_3500");
      const reencoded = Buffer.from(mutated).toString("base64url");
      const badJws = `${parts[0]}.${reencoded}.${parts[2]}`;
      const claims = await verifyIapJws(badJws, {
        trustedRootPem: root.certPem,
      });
      assert.equal(claims, null, "tampered JWS must be rejected");
    }]);

    tests.push(["verifyIapJws rejects wrong bundle id", async () => {
      const jws = await buildSignedJws({
        leaf,
        root,
        payload: { ...basePayload, bundleId: "com.evil.example" },
      });
      const claims = await verifyIapJws(jws, {
        trustedRootPem: root.certPem,
        expectedBundleId: "com.carai.kabutoios",
      });
      assert.equal(claims, null, "wrong bundle id must be rejected");
    }]);

    tests.push(["verifyIapJws rejects chain that doesn't chain to pinned root", async () => {
      // Sign the JWS with our local chain, but pin the REAL Apple Root CA G3.
      // Chain will not validate.
      const jws = await buildSignedJws({ leaf, root, payload: basePayload });
      const { APPLE_ROOT_CA_G3_PEM } = await import("./apple-root-ca");
      const claims = await verifyIapJws(jws, {
        trustedRootPem: APPLE_ROOT_CA_G3_PEM,
        expectedBundleId: "com.carai.kabutoios",
      });
      assert.equal(claims, null, "unknown root must be rejected");
    }]);

    tests.push(["verifyIapJws rejects expired leaf", async () => {
      const jws = await buildSignedJws({ leaf, root, payload: basePayload });
      // Pretend the current time is 100 years in the future.
      const future = new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000);
      const claims = await verifyIapJws(jws, {
        trustedRootPem: root.certPem,
        clock: future,
      });
      assert.equal(claims, null, "expired cert must be rejected");
    }]);

    tests.push(["verifyIapJws rejects a raw 3-segment fake (no real crypto)", async () => {
      const fake = "fakeheader.fakepayload.fakesig";
      const claims = await verifyIapJws(fake);
      assert.equal(claims, null);
    }]);

    // Verify that our generated chain actually validates as X509:
    tests.push(["generated chain is internally consistent", async () => {
      const rootCert = new X509Certificate(root.certPem);
      const leafCert = new X509Certificate(leaf.certPem);
      const pk = createPrivateKey(leaf.keyPem);
      assert.ok(pk, "leaf private key should parse");
      assert.ok(leafCert.verify(rootCert.publicKey), "leaf should be signed by root");
    }]);

    let passed = 0;
    let failed = 0;
    for (const [name, fn] of tests) {
      try {
        await fn();
        console.log(`✓ ${name}`);
        passed += 1;
      } catch (err) {
        console.error(`✗ ${name}`);
        console.error(err);
        failed += 1;
      }
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
