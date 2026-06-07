export const BACKUP_VERSION = 1

export function makeBackup({ products = [], semifinished = [], referenceTtks = [] }) {
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), products, semifinished, referenceTtks }
}

export function normalizeBackup(payload = {}) {
  return {
    products: Array.isArray(payload.products) ? payload.products : [],
    semifinished: Array.isArray(payload.semifinished) ? payload.semifinished : [],
    referenceTtks: Array.isArray(payload.referenceTtks) ? payload.referenceTtks : (Array.isArray(payload.referenceTtk) ? payload.referenceTtk : []),
  }
}
