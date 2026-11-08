/**
 * Flat illustrations of each plant, drawn in a 60 × 100 viewBox with the pot
 * sitting on the bottom edge. Used in plant cards and for the on-device preview
 * when AI image generation is unavailable.
 */

const pot = (fill: string, rim: string, top = 78) =>
  `<rect x="15" y="${top - 3}" width="30" height="6" rx="2" fill="${rim}"/>` +
  `<path d="M18 ${top}H42L39 100H21Z" fill="${fill}"/>`

const TERRACOTTA = pot('#C97F5C', '#B06A48')
const CLAY = pot('#B8714F', '#9D5D3F')
const WHITE = pot('#F3F1EA', '#D9D4C6')
const CONCRETE = pot('#B9BDB8', '#9FA49E')
const SAND = pot('#D8C3A0', '#C2AA82')

export const PLANT_ART: Record<string, string> = {
  snake:
    '<path d="M24 80L14 22L31 80Z" fill="#2F9E6F"/><path d="M30 80L33 4L39 80Z" fill="#3FBF8A"/>' +
    '<path d="M36 80L49 26L43 80Z" fill="#2F9E6F"/><path d="M27 80L22 40L33 80Z" fill="#7DDDB0"/>' +
    TERRACOTTA,
  rubber:
    '<path d="M30 80V40" stroke="#2B6B4F" stroke-width="3"/>' +
    '<ellipse cx="30" cy="30" rx="11" ry="22" fill="#1F6F4F"/>' +
    '<ellipse cx="46" cy="52" rx="9" ry="17" fill="#2F8F68" transform="rotate(40 46 52)"/>' +
    '<ellipse cx="14" cy="52" rx="9" ry="17" fill="#2F8F68" transform="rotate(-40 14 52)"/>' +
    WHITE,
  pothos:
    '<g fill="#43B97F"><ellipse cx="30" cy="58" rx="9" ry="11"/><ellipse cx="18" cy="62" rx="8" ry="10" transform="rotate(-30 18 62)"/><ellipse cx="42" cy="62" rx="8" ry="10" transform="rotate(30 42 62)"/></g>' +
    '<g fill="#2F9E6F"><ellipse cx="9" cy="80" rx="7" ry="10"/><ellipse cx="7" cy="93" rx="6" ry="8"/><ellipse cx="51" cy="82" rx="7" ry="10"/><ellipse cx="53" cy="95" rx="6" ry="8"/></g>' +
    SAND,
  areca:
    '<g stroke="#2F9E6F" stroke-width="5" stroke-linecap="round" fill="none"><path d="M30 82Q18 40 3 32"/><path d="M30 82Q42 40 57 32"/><path d="M30 82Q30 40 30 6"/><path d="M30 82Q22 50 12 14"/><path d="M30 82Q38 50 48 14"/></g>' +
    CLAY,
  aloe:
    '<g fill="#4DBB8A"><path d="M30 88L12 54L32 84Z"/><path d="M30 88L48 54L28 84Z"/><path d="M30 88L24 40L36 86Z"/><path d="M30 88L38 44L26 86Z"/></g>' +
    pot('#C97F5C', '#B06A48', 84),
  fern:
    '<g stroke="#2E9F63" stroke-width="4" stroke-linecap="round" fill="none"><path d="M30 82Q30 50 8 52"/><path d="M30 82Q30 44 52 50"/><path d="M30 82Q24 40 14 30"/><path d="M30 82Q36 40 46 30"/><path d="M30 82Q30 36 30 22"/></g>' +
    WHITE,
  tecoma:
    '<path d="M30 80V34" stroke="#6B4F2E" stroke-width="3"/>' +
    '<g fill="#3E9E5F"><circle cx="30" cy="28" r="15"/><circle cx="17" cy="42" r="12"/><circle cx="43" cy="42" r="12"/><circle cx="30" cy="50" r="11"/></g>' +
    '<g fill="#F5C518"><circle cx="22" cy="26" r="3"/><circle cx="38" cy="24" r="3"/><circle cx="30" cy="38" r="3"/><circle cx="15" cy="44" r="2.5"/><circle cx="45" cy="45" r="2.5"/><circle cx="34" cy="52" r="2.5"/></g>' +
    CLAY,
  pandan:
    '<g stroke="#4DBF5B" stroke-width="5" stroke-linecap="round" fill="none"><path d="M30 80Q26 50 8 30"/><path d="M30 80Q34 50 52 30"/><path d="M30 80Q30 45 28 12"/><path d="M30 80Q22 62 4 58"/><path d="M30 80Q38 62 56 58"/></g>' +
    CONCRETE,
  fiddle:
    '<path d="M30 80V22" stroke="#6B4F2E" stroke-width="3"/>' +
    '<g fill="#2E7D4F"><ellipse cx="30" cy="15" rx="9" ry="12"/><ellipse cx="18" cy="32" rx="9" ry="12" transform="rotate(-35 18 32)"/><ellipse cx="42" cy="34" rx="9" ry="12" transform="rotate(35 42 34)"/><ellipse cx="20" cy="55" rx="8" ry="11" transform="rotate(-40 20 55)"/><ellipse cx="40" cy="57" rx="8" ry="11" transform="rotate(40 40 57)"/></g>' +
    WHITE,
  peacelily:
    '<g stroke="#2F7A4F" stroke-width="1.5"><path d="M26 76V30M36 76V36"/></g>' +
    '<g fill="#2F7A4F"><ellipse cx="22" cy="60" rx="7" ry="16" transform="rotate(-25 22 60)"/><ellipse cx="38" cy="60" rx="7" ry="16" transform="rotate(25 38 60)"/><ellipse cx="30" cy="56" rx="7" ry="18"/></g>' +
    '<g fill="#FFFFFF" stroke="#CFE0D6"><ellipse cx="26" cy="28" rx="5" ry="9"/><ellipse cx="36" cy="34" rx="4.5" ry="8"/></g>' +
    WHITE,
  spider:
    '<g stroke="#5DBB63" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M30 78Q14 50 4 66"/><path d="M30 78Q46 50 56 66"/><path d="M30 78Q20 44 10 46"/><path d="M30 78Q40 44 50 46"/><path d="M30 78Q28 46 24 36"/><path d="M30 78Q32 46 36 36"/></g>' +
    '<g stroke="#EAF7E1" stroke-width="1" fill="none"><path d="M30 78Q20 44 10 46"/><path d="M30 78Q40 44 50 46"/><path d="M30 78Q28 46 24 36"/></g>' +
    SAND,
  croton:
    '<path d="M30 80V40" stroke="#6B4F2E" stroke-width="2.5"/>' +
    '<ellipse cx="30" cy="32" rx="6" ry="13" fill="#E5533D"/>' +
    '<ellipse cx="18" cy="47" rx="6" ry="13" fill="#F2A33A" transform="rotate(-40 18 47)"/>' +
    '<ellipse cx="42" cy="47" rx="6" ry="13" fill="#3E9E5F" transform="rotate(40 42 47)"/>' +
    '<ellipse cx="21" cy="64" rx="5" ry="11" fill="#2F8F55" transform="rotate(-55 21 64)"/>' +
    '<ellipse cx="39" cy="64" rx="5" ry="11" fill="#F2C94C" transform="rotate(55 39 64)"/>' +
    TERRACOTTA,
  lemongrass:
    '<g stroke="#8CCB5E" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M30 80Q24 40 10 14"/><path d="M30 80Q36 40 50 14"/><path d="M30 80Q28 40 24 6"/><path d="M30 80Q32 40 38 8"/><path d="M30 80Q20 50 4 34"/><path d="M30 80Q40 50 56 34"/><path d="M30 80Q30 50 30 10"/></g>' +
    CONCRETE,
  monstera:
    '<g stroke="#3A6B4A" stroke-width="2"><path d="M30 80V40M30 80L16 52M30 80L44 52"/></g>' +
    '<g fill="#2E8B57"><ellipse cx="30" cy="30" rx="16" ry="13"/><ellipse cx="14" cy="50" rx="13" ry="10" transform="rotate(-20 14 50)"/><ellipse cx="46" cy="50" rx="13" ry="10" transform="rotate(20 46 50)"/></g>' +
    '<g stroke="#1E5E3B" stroke-width="1.6"><path d="M30 30L18 24M30 30L42 24M30 30L20 38M30 30L40 38M14 50L5 46M14 50L6 56M46 50L55 46M46 50L54 56"/></g>' +
    CLAY,
  calathea:
    '<g stroke="#3A6B4A" stroke-width="1.5"><path d="M30 80V50M30 80L19 60M30 80L41 60"/></g>' +
    '<g fill="#3F8F63"><ellipse cx="30" cy="38" rx="9" ry="16"/><ellipse cx="17" cy="52" rx="8" ry="14" transform="rotate(-35 17 52)"/><ellipse cx="43" cy="52" rx="8" ry="14" transform="rotate(35 43 52)"/></g>' +
    '<g stroke="#A6E3B8" stroke-width="1.2" fill="none"><path d="M30 24V52M24 32L30 36L36 32M24 42L30 46L36 42"/></g>' +
    WHITE,
}

export function plantSvg(id: string, width?: number, height?: number): string {
  const size = width && height ? ` width="${width}" height="${height}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"${size}>${PLANT_ART[id] ?? ''}</svg>`
}
