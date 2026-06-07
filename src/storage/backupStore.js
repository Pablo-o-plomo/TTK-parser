export const BACKUP_VERSION = 1

export function makeBackup({ products = [], semifinished = [], referenceTtks = [] }) {
  return {
    products,
    semifinished,
    referenceTtks,
    exportedAt: new Date().toISOString(),
    version: BACKUP_VERSION,
  }
}

export function normalizeBackup(payload = {}) {
  return {
    products: Array.isArray(payload.products) ? payload.products : [],
    semifinished: Array.isArray(payload.semifinished) ? payload.semifinished : [],
    referenceTtks: Array.isArray(payload.referenceTtks) ? payload.referenceTtks : [],
  }
}
