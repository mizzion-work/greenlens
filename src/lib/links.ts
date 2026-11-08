export function shopeeUrl(nameTh: string): string {
  return `https://shopee.co.th/search?keyword=${encodeURIComponent(`ต้น${nameTh}`)}`
}

export function lazadaUrl(nameTh: string): string {
  return `https://www.lazada.co.th/catalog/?q=${encodeURIComponent(`ต้น${nameTh}`)}`
}

export function nurseriesMapUrl(coords?: { lat: number; lon: number } | null): string {
  const q = 'ร้านขายต้นไม้'
  if (coords) {
    return `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${coords.lat.toFixed(5)},${coords.lon.toFixed(5)},14z`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${q}ใกล้ฉัน`)}`
}

export function formatBaht(n: number): string {
  return `฿${n.toLocaleString('th-TH')}`
}
