# Gold2cash.shop website source

ชุดไฟล์นี้รวบรวมจากซอร์สของเว็บไซต์ `gold2cash.tobanfriend.chatgpt.site`

## ไฟล์หลัก

- `app/page.tsx` — หน้าเว็บไซต์หลัก (ทำหน้าที่แทน `index.html` หรือ `index.php`)
- `app/layout.tsx` — โครงสร้างส่วนกลางของเว็บไซต์
- `app/globals.css` — รูปแบบและการรองรับหน้าจอมือถือ/เดสก์ท็อป
- `app/api/` — API สำหรับราคา ประวัติ และบทวิเคราะห์ AI
- `public/` — โลโก้และไฟล์สาธารณะ
- `package.json` และ `package-lock.json` — รายการแพ็กเกจและคำสั่งใช้งาน
- `db/` และ `drizzle/` — โครงสร้างฐานข้อมูล
- `README.md` — คู่มือโปรเจกต์

เว็บไซต์นี้ใช้ Next.js/TypeScript จึงไม่มีไฟล์ `header.php` และ `footer.php` แยกต่างหาก ส่วนหัวและส่วนท้ายอยู่ในคอมโพเนนต์ของหน้าเว็บและ layout

## เริ่มใช้งานในเครื่อง

```bash
npm ci
npm run dev
```

ห้ามใส่ API keys ลงในซอร์สหรือไฟล์ ZIP ให้กำหนดค่าผ่าน Environment Variables ของผู้ให้บริการโฮสติ้ง
