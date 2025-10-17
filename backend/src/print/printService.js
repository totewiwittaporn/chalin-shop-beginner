// backend/src/print/printService.js
import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import prisma from "#app/lib/prisma.js"; // ← เปลี่ยนมาใช้ alias ให้ตรงโปรเจกต์

// ตัวช่วย: format ตัวเลข / บาทเป็นข้อความไทย (แบบย่อ)
function fmt(n) {
  return Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function thaiBahtText(amount) {
  const num = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
  const pos = ["","สิบ","ร้อย","พัน","หมื่น","แสน","ล้าน"];
  function readInt(n){ if(n===0) return ""; let s="",i=0; while(n>0){const a=n%10,p=i%6; if(i%6===0&&i>0) s=pos[6]+s; if(a!==0){let w=num[a]; if(p===0&&i>0&&a===1) w="เอ็ด"; if(p===1){ if(a===2) w="ยี่"; if(a===1) w=""; } s=w+pos[p]+s;} n=Math.floor(n/10); i++;} return s;}
  const a = Math.floor(Math.abs(Number(amount)||0));
  const st = Math.round((Math.abs(Number(amount)||0) - a) * 100);
  const b = readInt(a) || num[0];
  return st===0 ? `${b}บาทถ้วน` : `${b}บาท${readInt(st)}สตางค์`;
}

export async function renderDeliveryNoteA4PDF(documentId) {
  // 1) ดึงข้อมูลเอกสารจาก DB
  const doc = await prisma.document.findUnique({
    where: { id: Number(documentId) },
    include: {
      items: {
        select: {
          productId: true,
          qty: true,
          price: true,
          lineTotal: true,
          product: { select: { name: true } },
        },
      },
      branch: true, // เผื่อใช้ต่อ
    },
  });
  if (!doc) throw new Error("Document not found");

  // 2) สร้าง rows 10 แถวคงที่
  const rows = [];
  const items = doc.items || [];
  for (let i = 0; i < 10; i++) {
    const it = items[i];
    if (it) {
      rows.push({
        description: it.product?.name || "",
        price: fmt(it.price),
        qty: it.qty,
        lineTotal: fmt(it.lineTotal ?? (it.price || 0) * (it.qty || 0)),
      });
    } else {
      rows.push({ description: "", price: "", qty: "", lineTotal: "" });
    }
  }

  const total = items.reduce((s, i) => s + (i.lineTotal ?? (i.price || 0) * (i.qty || 0)), 0);
  const payload = {
    date: new Date(doc.docDate).toLocaleDateString(),
    docNo: doc.docNo || `DN-${String(doc.id).padStart(6, "0")}`,
    // TODO: ปรับ mapping ให้ตรง schema จริงของคุณสำหรับผู้ส่ง/ผู้รับ
    to: doc.recipient || { name: "-", addr1: "", addr2: "", addr3: "", phone: "" },
    from: doc.issuer || { name: "-", addr1: "", addr2: "", addr3: "", phone: "" },
    rows,
    total: fmt(total),
    totalText: thaiBahtText(total),
  };

  // 3) โหลด/คอมไพล์เทมเพลต
  const tplPath = path.resolve("src/print/templates/delivery-note-a4.hbs");
  const source = await fs.readFile(tplPath, "utf8");
  const tpl = Handlebars.compile(source);
  const html = tpl(payload);

  // 4) ใช้ Puppeteer เรนเดอร์ PDF A4
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--font-render-hinting=medium"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  return pdf;
}
