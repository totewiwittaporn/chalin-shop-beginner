# Chalin Shop Backend (JavaScript, Express + Prisma)

โครง backend มินิมอลสำหรับโปรเจกต์ `chalin-shop-beginner`

## Stack
- Node.js (ES Modules)
- Express
- Prisma ORM
- PostgreSQL (เช่น Supabase/Neon/Railway) — *สลับไป DB อื่นได้ โดยแก้ใน `prisma/schema.prisma`*
- JWT Auth
- CORS/Helmet/Morgan

## รันครั้งแรก
```bash
cd backend
cp .env.example .env   # แก้ค่า DATABASE_URL, JWT_SECRET, CORS_ORIGIN
npm i
npm run db:push
npm run db:seed
npm run dev
```

API จะอยู่ที่ `http://localhost:${PORT || 5000}/api`

## Frontend เชื่อม API
ตั้งค่าใน client (Vite):
```
VITE_API_URL=http://localhost:5000/api
```

หรือใช้ axios instance ที่อิงตัวแปรนี้ แล้วแนบ `Authorization: Bearer <token>` เมื่อ login แล้ว

## Routes
- `GET /api/health` — ตรวจสุขภาพ
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/product-types?search=...`
- `POST /api/product-types` (ADMIN/STAFF)
- `PUT /api/product-types/:id` (ADMIN/STAFF)
- `DELETE /api/product-types/:id` (ADMIN) — กันลบถ้า type ถูกใช้อยู่กับสินค้า
- `GET /api/branches?search=...`
- `POST /api/branches` (ADMIN)
- `PUT /api/branches/:id` (ADMIN)
