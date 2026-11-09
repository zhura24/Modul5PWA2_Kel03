const STORAGE_KEY = 'bore_barrel_archived_guns'
const PERMANENTLY_DELETED_KEY = 'bore_barrel_permanently_deleted_guns'

function readArchivedIds() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  const ids = JSON.parse(raw)
  if (!Array.isArray(ids)) {
    throw new Error('Archived items data is invalid. Clear the browser storage and try again.')
  }
  return ids.map(String)
}

function writeArchivedIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids.map(String))]))
}

export function getArchivedGunIds() {
  try {
    return readArchivedIds()
  } catch (error) {
    throw new Error(`Could not read archived items: ${error.message}`)
  }
}

export function archiveGun(id) {
  try {
    if (id == null) throw new Error('A product id is required.')
    writeArchivedIds([...readArchivedIds(), String(id)])
  } catch (error) {
    throw new Error(`Could not archive item: ${error.message}`)
  }
}

export function restoreGun(id) {
  try {
    writeArchivedIds(readArchivedIds().filter((archivedId) => archivedId !== String(id)))
  } catch (error) {
    throw new Error(`Could not restore item: ${error.message}`)
  }
}

export function getPermanentlyDeletedGunIds() {
  try {
    const raw = localStorage.getItem(PERMANENTLY_DELETED_KEY)
    if (!raw) return []
    const ids = JSON.parse(raw)
    if (!Array.isArray(ids)) {
      throw new Error('Permanently deleted item data is invalid.')
    }
    return ids.map(String)
  } catch (error) {
    throw new Error(`Could not read permanently deleted items: ${error.message}`)
  }
}

export function permanentlyDeleteGun(id) {
  try {
    if (id == null) throw new Error('A product id is required.')
    const deletedIds = getPermanentlyDeletedGunIds()
    localStorage.setItem(
      PERMANENTLY_DELETED_KEY,
      JSON.stringify([...new Set([...deletedIds, String(id)])]),
    )
    writeArchivedIds(readArchivedIds().filter((archivedId) => archivedId !== String(id)))
  } catch (error) {
    throw new Error(`Could not permanently delete item: ${error.message}`)
  }
}
