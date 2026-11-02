# Rootcash

Bảng tính dòng tiền bỏ túi — một khung cố định, vài con số thay đổi, ra free float của tháng.

Web app (PWA) local-first, không backend. Dữ liệu chỉ nằm trên thiết bị.

## Cách nghĩ

Không ghi từng khoản chi. Dựng một **khung** cho mọi tháng, rồi chỉ chỉnh vài biến số:

```
Free float = Số dư đầu tháng + Thu − Lịch trả nợ − Chi cố định ± Khoản một lần − Sinh hoạt
```

Mọi khoản trong khung đều tính là đã chi — không có công tắc "kế hoạch / đã chi".

App quản lý **một tháng tại một thời điểm**: chạm tên tháng ở đầu trang để chọn tháng đang quản lý,
cả ba tab nhảy theo. Mỗi tháng tính độc lập — số dư đầu tháng do bạn nhập, không cộng dồn từ tháng trước.
Khoản không rơi vào tháng đang chọn (chưa tới hạn, đã kết thúc, thuộc tháng khác) được bôi mờ trong Khung.

## Màn hình

- **Tháng** — free float ở trên cùng. Nhập số dư đầu tháng và sinh hoạt bằng số; phép tính cập nhật ngay.
- **Dòng tiền** — biểu đồ cột: mỗi cột là số dư cuối ngày, dưới trục là từng khoản chi xếp chồng (một ngày nhiều khoản vẫn thấy rõ). Chạm một cột để xem chi tiết ngày đó.
- **Khung** — chi cố định (theo ngày hoặc trải đều), sinh hoạt, thu, lịch trả nợ (có tháng kết thúc), khoản một lần. Sửa số tiền trực tiếp trong danh sách; thu màu xanh, chi màu đỏ. Sao lưu / khôi phục / xoá toàn bộ ở cuối trang.

Sinh hoạt và chi cố định "trải đều" được trừ đều mỗi ngày trong biểu đồ.

## Dữ liệu

Lưu ở `localStorage` khoá `rootcash:v2`. Lần đầu mở, dữ liệu bản cũ (khoá `rootcash`) được chuyển sang khung mới; bản cũ được giữ nguyên, không xoá.

## Chạy local

```bash
python -m http.server 8080   # mở http://localhost:8080
node tests/domain.test.js
```

## Thêm vào màn hình chính

Mở bản deploy bằng Safari trên iPhone → Share → Add to Home Screen.

© derekdaydoi
