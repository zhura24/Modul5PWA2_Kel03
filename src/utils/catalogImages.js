const STORAGE_PREFIX = 'bore_barrel_catalog_images:'

function toImageUrlList(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((image) => (typeof image === 'string' ? image : image?.url))
    .filter((url) => typeof url === 'string' && url.length > 0)
}

export function getCatalogImages(gun) {
  const imageUrls = [
    ...toImageUrlList(gun?.image_urls),
    ...toImageUrlList(gun?.images),
    gun?.image_url,
    gun?.image,
  ].filter((url) => typeof url === 'string' && url.length > 0)

  if (gun?.id) {
    try {
      const saved = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${gun.id}`) || '[]')
      imageUrls.push(...toImageUrlList(saved))
    } catch (error) {
      console.warn(`[catalogImages] Could not read the image gallery for "${gun.id}".`, error)
    }
  }

  return [...new Set(imageUrls)]
}

export function saveCatalogImages(gunId, imageUrls) {
  if (!gunId) throw new Error('A product ID is required to save its image gallery.')
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${gunId}`,
      JSON.stringify([...new Set(toImageUrlList(imageUrls))]),
    )
  } catch (error) {
    throw new Error(`Could not save this product's image gallery: ${error.message}`)
  }
}
