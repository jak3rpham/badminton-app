# 🏸 Chia tiền cầu lông

App PWA (cài thẳng lên điện thoại) để nhóm cầu lông tick người chơi, tự chia tiền và theo dõi ai đã chuyển khoản. Dữ liệu lưu chung trên **Supabase**, đồng bộ **realtime** — ai tick "đã trả" thì máy mọi người tự cập nhật.

---

## 1. Tạo database trên Supabase (5 phút)

1. Vào https://supabase.com → tạo project mới (free). Đợi ~2 phút cho project khởi tạo.
2. Mở **SQL Editor** → **New query** → dán toàn bộ nội dung file `supabase/schema.sql` → **Run**.
3. Vào **Project Settings → API**, copy 2 giá trị:
   - **Project URL** → là `VITE_SUPABASE_URL`
   - **anon public** key → là `VITE_SUPABASE_ANON_KEY`

> ⚠️ Chỉ dùng key **anon public**. Tuyệt đối **không** đưa `service_role` key vào app.

---

## 2. Chạy thử ở máy (tuỳ chọn)

```bash
cp .env.example .env        # rồi điền URL + anon key vào .env
npm install
npm run dev                 # mở http://localhost:5173
```

---

## 3. Deploy để cả nhóm dùng (chọn 1)

### Cách A — Vercel (dễ nhất)
1. Đẩy thư mục này lên một repo GitHub.
2. https://vercel.com → **Add New → Project** → chọn repo.
3. Ở bước cấu hình, thêm 2 **Environment Variables**:
   `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Vercel đưa ra link dạng `https://ten-app.vercel.app`.

### Cách B — Netlify / Cloudflare Pages
Tương tự: build command `npm run build`, output `dist`, thêm 2 env var như trên.

---

## 4. Cài lên điện thoại (PWA)

Gửi link cho cả nhóm. Trên điện thoại mở link bằng trình duyệt rồi:
- **iPhone (Safari):** nút Chia sẻ → **Thêm vào MH chính**.
- **Android (Chrome):** menu ⋮ → **Cài đặt ứng dụng / Thêm vào MH chính**.

Xong, app hiện icon quả cầu lông như app thật, mở full màn hình.

---

## 5. Dùng app

1. Tab **Cài đặt** → nhập ngân hàng + STK + tên chủ TK (và MoMo nếu muốn).
2. Tab **Thành viên** → nhập danh sách nhóm một lần.
3. Tab **Buổi chơi** → "Tạo buổi chơi mới": nhập tiền sân/cầu/nước, tick ai có mặt (thêm khách lẻ được). App tự chia đều, làm tròn lên 1.000đ.
4. Mở buổi ra: nút **QR** cho từng người (VietQR + nội dung CK), và nút **Đã trả / Chưa trả** để host đánh dấu khi thấy tiền vào (MoMo hay bank đều được).

---

## 6. Nâng cấp bảo mật (khi cần)

Mặc định RLS đang để mở cho role `anon` — đủ cho nhóm chơi vui, dựa vào việc giữ kín đường link. Nếu muốn chặt hơn:

- **Khoá bằng đăng nhập:** bật Supabase Auth (magic link / Google), đổi policy từ `to anon, authenticated` thành `to authenticated`, và thêm bước đăng nhập ở app.
- **Mã nhóm:** thêm một màn hình nhập "mã nhóm" trước khi vào (chặn người lạ vô tình mở link).

Nói mình nếu muốn thêm phần này.

---

## 7. Tự động đánh dấu "đã trả" (tương lai)

Nếu sau này cả nhóm gom về **một tài khoản ngân hàng**, có thể gắn **SePay** (free 500 giao dịch/tháng):
SePay phát hiện tiền vào → bắn webhook → một **Supabase Edge Function** (hoặc n8n) đối chiếu nội dung CK `CL TÊN ddMM` → tự update cột `paid`. Realtime sẽ đẩy lên app, khỏi tick tay.
Lưu ý: SePay chỉ đọc được **tài khoản ngân hàng**, không đọc được ví MoMo.

---

## Cấu trúc

```
src/App.jsx        — toàn bộ giao diện + logic
src/supabase.js    — kết nối Supabase
src/index.css      — style
supabase/schema.sql — tạo bảng + RLS + realtime
vite.config.js     — cấu hình PWA
```
