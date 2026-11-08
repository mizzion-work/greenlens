export interface Pm25Level {
  label: string
  /** CSS color token name for the badge. */
  tone: 'blue' | 'green' | 'yellow' | 'orange' | 'red'
  advice: string
}

/**
 * Thailand Pollution Control Department PM2.5 bands (24-hour average, µg/m³),
 * revised June 2023.
 */
export function pm25Level(ugm3: number): Pm25Level {
  if (ugm3 <= 15) return { label: 'ดีมาก', tone: 'blue', advice: 'อากาศดีมาก เหมาะกับกิจกรรมกลางแจ้ง' }
  if (ugm3 <= 25) return { label: 'ดี', tone: 'green', advice: 'คุณภาพอากาศดี' }
  if (ugm3 <= 37.5)
    return { label: 'ปานกลาง', tone: 'yellow', advice: 'กลุ่มเสี่ยงควรลดกิจกรรมกลางแจ้ง' }
  if (ugm3 <= 75)
    return {
      label: 'เริ่มมีผลกระทบต่อสุขภาพ',
      tone: 'orange',
      advice: 'ควรลดเวลาทำกิจกรรมกลางแจ้ง ต้นไม้ช่วยดักฝุ่นรอบบ้านได้',
    }
  return {
    label: 'มีผลกระทบต่อสุขภาพ',
    tone: 'red',
    advice: 'ควรงดกิจกรรมกลางแจ้งและสวมหน้ากากเมื่อออกนอกบ้าน',
  }
}
