// ════════════════════════════════════════════════════════════
//  CHỖ SỬA NHANH — chỉ cần đổi mấy dòng dưới đây
// ════════════════════════════════════════════════════════════

export const config = {
  // 1) Link nút "Mở MoMo". Lấy trong app MoMo:
  //    Yêu cầu chuyển tiền → "Link nhận tiền của tôi" → Sao chép.
  //    Để trống ("") nếu chưa có thì nút sẽ tự ẩn.
  momoLink: "",   // vd: "https://nhantien.momo.vn/xxxxxxxx"

  // 2) Ảnh QR tĩnh để mọi người quét (vd ảnh QR MoMo của host).
  //    Bỏ file ảnh vào thư mục public/ rồi ghi ĐÚNG tên file ở đây.
  //    Để trống ("") thì app dùng QR ngân hàng tự sinh (nếu đã nhập STK ở tab Cài đặt).
  qrImage: "/payment-qr.png",

  // 3) Dòng ghi chú hiển thị dưới ảnh QR.
  qrNote: "Quét mã QR, hoặc bấm “Mở MoMo” bên dưới.",

  // 4) Mã admin (PIN). Host nhập mã này để mở khoá tạo/sửa/xoá buổi + Cài đặt.
  //    Để trống ("") nếu muốn AI CŨNG sửa được (không phân quyền).
  adminPin: "2000",   // vd: "2468"
};
