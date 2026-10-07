# Rootcash

Personal Treasury — *Kiểm soát dòng tiền. Tự do trong phần còn lại.*

Web app (PWA) local-first, không cần backend. Dữ liệu chỉ lưu trên thiết bị.

- **Dòng tiền**: timeline thu/chi theo ngày, lọc Thu / Chi, khoản lặp hàng tháng, xác nhận đã nhận / đã chi.
- **Tổng quan**: thặng dư hoặc thâm hụt cuối tháng, khối Sinh hoạt (VD dư 15tr, sinh hoạt 10tr → chưa phân bổ 5tr), biểu đồ dòng tiền tích lũy, Buffer cần giữ.
- **Tài sản**: tài sản ròng, tài sản, nợ, thanh khoản (tiền mặt + ngân hàng).

## Buffer

Dòng tiền tích lũy từ đầu tháng, sinh hoạt trừ đều theo ngày, trong cùng ngày chi trước thu. Buffer = điểm thấp nhất nếu âm, làm tròn lên 500.000đ.

## Chạy local

```bash
python -m http.server 8080   # mở http://localhost:8080
node tests/domain.test.js
```

## Thêm vào màn hình chính

Mở bản deploy bằng Safari trên iPhone → Share → Add to Home Screen.

© Copyright from Derekdaydoi
