/**
 * Cryptographic Utility for Chain of Custody (SHA-256)
 * Uses browser Web Crypto API to ensure secure hashing across variable panels.
 */

export async function computeSha256(textOrBuffer) {
  let buffer;
  if (typeof textOrBuffer === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(textOrBuffer);
  } else if (textOrBuffer instanceof ArrayBuffer) {
    buffer = textOrBuffer;
  } else if (textOrBuffer instanceof Uint8Array) {
    buffer = textOrBuffer.buffer;
  } else {
    const encoder = new TextEncoder();
    buffer = encoder.encode(String(textOrBuffer));
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Computes individual SHA-256 hashes ONLY for provided active panels (1 to N).
 * Does not insert dummy hashes or default to 4 slots.
 */
export async function computePanelHashes(panels) {
  const hashes = {};
  if (!panels || typeof panels !== 'object') return hashes;

  for (const [panelName, b64Data] of Object.entries(panels)) {
    if (b64Data && typeof b64Data === 'string' && b64Data.trim() !== '') {
      hashes[panelName] = await computeSha256(b64Data);
    }
  }
  return hashes;
}

/**
 * Computes a single Master Hash by deterministically combining the hashes of active panels:
 * SHA-256(hash_1 + hash_2 + ... + hash_N)
 */
export async function computeMasterHash(panelHashes) {
  const hashList = typeof panelHashes === 'object' && !Array.isArray(panelHashes)
    ? Object.values(panelHashes).filter(h => Boolean(h) && typeof h === 'string' && h !== '0'.repeat(64))
    : (Array.isArray(panelHashes) ? panelHashes.filter(Boolean) : []);

  if (hashList.length === 0) {
    return await computeSha256("EMPTY_EVIDENTIARY_RECORD");
  }

  const combined = hashList.join('');
  return await computeSha256(combined);
}
