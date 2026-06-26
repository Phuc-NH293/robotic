# Inspectra — Robot Vision Quality Control

Nền tảng web quản lý kiểm tra chất lượng tự động bằng robot và AI thị giác.

## Kiến trúc

- `frontend/`: Next.js 16, React 19, TypeScript.
- `backend/`: FastAPI, JWT authentication, SQLite.
- Có đăng nhập, phân quyền, dashboard, báo cáo, duyệt kết quả, tạo lượt kiểm tra và quản lý người dùng.
- OpenAPI có tại `http://localhost:8000/docs`.

## Chạy development

```bash
npm install
python -m pip install -r backend/requirements.txt
npm run dev
```

Truy cập:

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

Tài khoản demo:

- Admin: `admin@inspectra.ai` / `admin123`
- Inspector: `inspector@inspectra.ai` / `inspect123`
- Operator: `operator@inspectra.ai` / `operator123`

## Biến môi trường

Sao chép:

- `frontend/.env.example` thành `frontend/.env.local`
- `backend/.env.example` thành `.env` hoặc thiết lập trực tiếp trong môi trường deploy

Đổi `INSPECTRA_SECRET_KEY` trước khi deploy production.

## API chính

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/stats`
- `GET /api/reports`
- `GET /api/reports/{id}`
- `PATCH /api/reports/{id}`
- `POST /api/reports/{id}/approve`
- `POST /api/inspections`
- `GET /api/users`
- `POST /api/users`

SQLite phù hợp cho demo và một instance nhỏ. Khi triển khai nhiều worker hoặc nhiều nhà máy, chuyển lớp database sang PostgreSQL; contract API frontend không cần thay đổi.
### Hướng dẫn chạy dự án với PostgreSQL:

  1. Chạy qua Docker (Khuyên dùng):
    docker-compose up --build
    Hệ thống sẽ tự động khởi động database PostgreSQL, khởi tạo bảng và seed dữ liệu mẫu.
  2. Chạy local trên máy:
      • Hãy chắc chắn bạn đã có PostgreSQL đang chạy trên máy local ở port  5432  với tài khoản tương ứng trong file  .env .
      • Cài đặt thư viện mới:
        python -m pip install -r backend/requirements.txt
        
      • Chạy dev server:
        npm run dev
        
        
