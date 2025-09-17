# Scripts Directory

Scripts đơn giản để setup hệ thống.

## Scripts

### `seed.js`
Script chính để seed toàn bộ hệ thống:
- Tạo role `super_admin` với ID = 1
- Gán tất cả permissions cho role này  
- Tạo user `superadmin` với password `admin123`
- Gán role `super_admin` cho user này

**Cách sử dụng:**
```bash
node scripts/seed.js
```

### `migrations/001_init_complete_system.sql`
Migration tạo toàn bộ database schema và seed data cơ bản.

## Yêu cầu

- Node.js
- PostgreSQL database
- File `.env` đã cấu hình