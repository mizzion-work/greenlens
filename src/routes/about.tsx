import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Calculator, Database, Leaf, ShieldCheck, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'เกี่ยวกับ — GreenLens AI' }] }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="prose-lite">
      <h1 className="page-title" style={{ marginTop: 6 }}>
        เกี่ยวกับ GreenLens AI
      </h1>
      <p className="muted" style={{ margin: '8px 0 0' }}>
        ช่วยให้คนเมืองเห็นภาพว่า ระเบียง ลานหน้าบ้าน หรือดาดฟ้าที่ว่างอยู่ จะสวยและน่าอยู่ขึ้นแค่ไหนถ้ามีต้นไม้ฟอกอากาศ
        เพื่อสร้างแรงบันดาลใจให้ลงมือปลูกจริง พื้นที่สีเขียวเล็ก ๆ หลายบ้านรวมกันช่วยลดความร้อนและฝุ่น PM2.5 ในระดับเมืองได้
      </p>

      <div className="section-head">
        <h2>
          <Sparkles size={19} /> ทำงานอย่างไร
        </h2>
      </div>
      <div className="card">
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>
            <b>วิเคราะห์ภาพ</b> AI (Google Gemini) ดูรูปเพื่อประเมินประเภทพื้นที่ แสงแดด และขนาด คุณปรับค่าเองได้เสมอ
          </li>
          <li>
            <b>เลือกต้นไม้</b> คัดจากฐานข้อมูลพรรณไม้ไทย 15 ชนิด ตามแสงแดด ขนาดพื้นที่ สัตว์เลี้ยง และความง่ายในการดูแล
          </li>
          <li>
            <b>สร้างภาพ</b> AI แก้ไขรูปจริงของคุณโดยเติมต้นไม้ที่เลือก หาก AI ใช้งานไม่ได้
            ระบบจะวาดภาพจำลองแบบง่ายบนเครื่องของคุณแทน
          </li>
        </ol>
      </div>

      <div className="section-head" id="method">
        <h2>
          <Calculator size={19} /> วิธีคำนวณผลกระทบ
        </h2>
      </div>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          ระบบประมาณพื้นที่ใบรวมจากจำนวนและขนาดต้นไม้ (เล็ก ~0.35, กลาง ~0.9, ใหญ่ ~2.2 ตร.ม. ต่อกระถาง)
          เทียบกับขนาดพื้นที่ แล้วถ่วงน้ำหนักด้วยคะแนนการดักฝุ่นและการลดความร้อนของแต่ละชนิด
        </p>
        <p>
          ผลลัพธ์จำกัดไว้ไม่เกิน 2°C และ 15% ซึ่งเป็นช่วงบนที่พบได้สำหรับพื้นที่สีเขียวขนาดเล็ก ตัวเลขเหล่านี้เป็นค่าประมาณเพื่อการเปรียบเทียบ{' '}
          <b>ไม่ใช่ค่าตรวจวัดจริง</b>
        </p>
        <p style={{ marginBottom: 0 }}>ข้อมูลความเป็นพิษต่อสัตว์เลี้ยงอ้างอิงรายชื่อพืชของ ASPCA ราคาเป็นราคาตลาดโดยประมาณ</p>
      </div>

      <div className="section-head" id="privacy">
        <h2>
          <ShieldCheck size={19} /> ความเป็นส่วนตัว
        </h2>
      </div>
      <div className="card">
        <p style={{ margin: 0 }}>
          รูปจะถูกย่อขนาดและลบข้อมูล EXIF/GPS บนเครื่องของคุณก่อนส่งให้ Google Gemini ประมวลผล GreenLens
          ไม่บันทึกรูปไว้บนเซิร์ฟเวอร์ ผลลัพธ์เก็บอยู่ในแท็บเบราว์เซอร์นี้เท่านั้นและหายไปเมื่อปิดแท็บ
          ตำแหน่งที่แม่นยำใช้เฉพาะเมื่อคุณกดอนุญาต เพื่อดึงค่าฝุ่นในพื้นที่
        </p>
      </div>

      <div className="section-head">
        <h2>
          <Database size={19} /> แหล่งข้อมูล
        </h2>
      </div>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>คุณภาพอากาศและสภาพอากาศ: Open-Meteo (แบบจำลอง CAMS)</li>
          <li>เกณฑ์ระดับ PM2.5: กรมควบคุมมลพิษ (ปรับปรุง มิ.ย. 2566)</li>
          <li>AI: Google Gemini</li>
        </ul>
      </div>

      <Link to="/" className="cta">
        <span className="cta-icon">
          <Leaf size={22} />
        </span>
        <span className="cta-text">
          <b>เริ่มจัดสวนของคุณ</b>
          <small>ถ่ายรูปพื้นที่ว่างได้เลย</small>
        </span>
        <ArrowRight size={22} />
      </Link>
    </main>
  )
}
