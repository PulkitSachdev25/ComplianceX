/**
 * Cryptographic Utility for Chain of Custody (SHA-256)
 * Uses browser Web Crypto API to ensure secure hashing.
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

export async function computePanelHashes(panels) {
  const hashes = {};
  for (const [panelName, b64Data] of Object.entries(panels)) {
    if (b64Data) {
      hashes[panelName] = await computeSha256(b64Data);
    } else {
      hashes[panelName] = await computeSha256(`EMPTY_PANEL_${panelName.toUpperCase()}`);
    }
  }
  return hashes;
}
