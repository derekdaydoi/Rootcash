# Rootcash

Personal Treasury — *Kiểm soát dòng tiền. Tự do trong phần còn lại.*

Web app (PWA) local-first, không backend. Dữ liệu chỉ nằm trên thiết bị.

## Màn hình

- **Tổng quan** — số dư hôm nay (tiền mặt + ngân hàng), biểu đồ dòng tiền 3 hoặc 6 tháng theo mốc giao dịch, ngày cần chuẩn bị tiền, tóm tắt sinh hoạt.
- **Dòng tiền** — timeline liên tục (cuộn là sang tháng sau) hoặc lịch tháng. Mỗi ngày có tổng thu, tổng chi, số dư cuối ngày. Lọc Thu / Chi / Kế hoạch.
- **Tài sản** — tài sản ròng, nợ, thanh khoản, quỹ kế hoạch. Số dư do người dùng tự nhập, độc lập với dòng tiền.
- **Sinh hoạt** — quỹ sinh hoạt từng tháng, chia theo mục tự đặt.

## Ba loại khoản

| Loại | Trong dòng tiền | Trong tài sản |
|---|---|---|
| Thu | cộng vào | — |
| Chi | trừ ra | — |
| Kế hoạch | chưa trừ cho tới khi bật "Đã chi" | nằm trong Quỹ kế hoạch |

Khoản lặp hàng tháng có thể **sửa riêng một tháng**, **bỏ qua một tháng**, hoặc **tự tính theo dư nợ**: lãi = gốc còn lại × lãi suất năm ÷ 12, gốc giảm dần theo số trả mỗi tháng.

## Dòng tiền và buffer

Biểu đồ chạy từ số dư thật (tiền mặt + ngân hàng), nhảy đúng ngày có tiền ra vào. Trong cùng một ngày, chi được tính trước thu, nên điểm thấp nhất là mức thận trọng. Sinh hoạt mặc định không nằm trong biểu đồ; bật công tắc *Gồm sinh hoạt* để trừ đều theo ngày.

## Chạy local

```bash
python -m http.server 8080   # mở http://localhost:8080
node tests/domain.test.js
```

## Thêm vào màn hình chính

Mở bản deploy bằng Safari trên iPhone → Share → Add to Home Screen.

© Copyright from Derekdaydoi
