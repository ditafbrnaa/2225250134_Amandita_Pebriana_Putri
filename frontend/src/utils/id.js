/** UUID v4. crypto.randomUUID tidak tersedia di HTTP non-localhost (mis. uji via IP Wi-Fi), jadi ada cadangan. */
export function uuid() {
  if (globalThis.crypto?.randomUUID) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      /* lanjut ke cadangan */
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
