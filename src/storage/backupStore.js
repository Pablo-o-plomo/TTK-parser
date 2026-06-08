export const BACKUP_VERSION = 2

export function makeBackup({ products = [], semifinished = [], referenceTtks = [], ttkGroups = [] }) {
  return {
    products,
    semifinished,
    referenceTtks,
    ttkGroups,
    exportedAt: new Date().toISOString(),
    version: BACKUP_VERSION,
  }
}

export function normalizeBackup(payload = {}) {
  return {
    products: Array.isArray(payload.products) ? payload.products : [],
    semifinished: Array.isArray(payload.semifinished) ? payload.semifinished : [],
    referenceTtks: Array.isArray(payload.referenceTtks) ? payload.referenceTtks : [],
    ttkGroups: Array.isArray(payload.ttkGroups) ? payload.ttkGroups : [],
  }
}
