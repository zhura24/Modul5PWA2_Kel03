export async function shareGunLink(gun) {
  if (!gun?.id) {
    throw new Error('This item does not have a shareable ID.')
  }

  const url = new URL(window.location.href)
  url.searchParams.set('gun', String(gun.id))

  if (typeof navigator.share === 'function') {
    await navigator.share({ title: gun.name || 'Catalog item', url: url.toString() })
    return 'shared'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url.toString())
    return 'copied'
  }

  throw new Error('Sharing and clipboard access are unavailable in this browser.')
}
