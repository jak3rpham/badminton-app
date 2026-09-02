# 🏸 Badminton Pay & Universal Debt Ledger
> **Hệ thống Quản Lý Chi Phí Cầu Lông, Chia Tiền Thông Minh & Sổ Nợ Tập Trung Toàn Diện**

Ứng dụng web hiện đại, chuyên nghiệp dành cho các nhóm chơi cầu lông tại Việt Nam để quản lý chi phí các buổi chơi, tính toán chia tiền thông minh và đặc biệt là **theo dõi tập trung tất cả các khoản nợ của mọi thành viên qua tất cả các game**.

---

## ✨ Tính Năng Nổi Bật

### 1. 💰 Sổ Nợ Tập Trung (Universal Debt Ledger - Tính năng trọng tâm)
- **Gom nhóm tự động**: Liệt kê tất cả những ai còn nợ tiền qua **mọi buổi chơi (games/sessions)** trong hệ thống.
- **Chi tiết từng buổi nợ**: Thể hiện ngày chơi, tên sân, số tiền còn thiếu, đã trả bao nhiêu.
- **Tạo mã VietQR Chuyển Khoản Tổng Nợ**: Tự động sinh mã QR ngân hàng chuẩn NAPAS theo STK của chủ sân/trưởng nhóm với đúng tổng số tiền nợ.
- **Sao chép tin nhắn nhắc nợ**: Sinh tin nhắn chi tiết, lịch sự, chuẩn format để gửi vào Zalo/Messenger chỉ với 1 cú click.
- **Thanh toán nhanh**: Đánh dấu đã trả toàn bộ nợ hoặc trả từng buổi kèm hiệu ứng chúc mừng Confetti.

### 2. 🏸 Quản Lý Buổi Chơi & Chia Tiền Linh Hoạt (Sessions & Expense Splitting)
- **Tạo buổi chơi linh hoạt**: Tiền sân (theo giờ / cố định), Tiền cầu (số quả × đơn giá), Tiền nước uống & phụ phí.
- **Cơ chế chia tiền**:
  - Chia đều (Equal split).
  - Chia theo thời gian chơi (1h, 1.5h, 2h,...).
  - Tùy chỉnh số tiền riêng cho từng người.
- **Trạng thái thanh toán theo từng người**: Đã trả (Paid), Còn nợ (Unpaid), Trả một phần (Partial).
- **Xuất hóa đơn buổi chơi**: Copy format text đẹp mắt để gửi nhanh vào nhóm chat Zalo.

### 3. 📊 Dashboard Thống Kê & Phân Bổ Chi Phí
- Thống kê tổng chi phí, tổng tiền đã thu về, tổng nợ tồn đọng.
- Biểu đồ phân bổ tỷ lệ chi phí (Tiền thuê sân, Tiền cầu lông, Nước uống, Khác).
- Cảnh báo Top thành viên còn nợ nhiều nhất cần thu hồi sớm.

### 4. 👥 Quản Lý Danh Bạ & Cài Đặt VietQR
- Danh bạ thành viên quen (lưu tên, avatar màu sắc, số điện thoại, cố định / vãng lai).
- Cấu hình tài khoản ngân hàng (VietQR) hỗ trợ tất cả các ngân hàng Việt Nam (MB, VCB, ACB, Techcombank, VPBank, VietinBank, BIDV,...).
- Sao lưu & khôi phục dữ liệu: Xuất / Nhập file JSON an toàn.

---

## 🛠️ Công Nghệ Sử Dụng

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** (Hệ thống màu sắc thể thao Emerald / Mint / Dark Mode & Glassmorphism)
- **Lucide React Icons**
- **VietQR QuickLink API**
- **Canvas-Confetti**

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Chạy ở chế độ phát triển (Development)**:
   ```bash
   npm run dev
   ```
   Truy cập vào trình duyệt: `http://localhost:3000`

3. **Build bản phát hành (Production)**:
   ```bash
   npm run build
   ```
