/* eslint-disable lingui/no-unlocalized-strings -- IndexedDB name, not UI copy */
import Dexie from 'dexie'

/**
 * Local IndexedDB (Dexie) — offline cache and outbox land in M3+.
 * v1: no object stores; versions will add `tasks`, `outbox`, etc.
 */
class AgrovaDexie extends Dexie {
  constructor() {
    super('agrova')
    this.version(1).stores({})
  }
}

export const db = new AgrovaDexie()
