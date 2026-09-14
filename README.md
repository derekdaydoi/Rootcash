# Rootcash

Rootcash là một PWA local-first để lập kế hoạch tài chính tháng sau theo cách đơn giản:

- Ngày 20 hàng tháng: nhập thủ công thu nhập dự kiến + ngày nhận.
- Nhập thủ công các khoản chi dự kiến + ngày phải trả.
- Rootcash tính **buffer cần giữ** dựa trên khoảng hụt dòng tiền theo ngày + biên an toàn.
- Phần còn lại được phân bổ vào các danh mục như Ăn uống, Mua sắm, Thể thao, Yêu đương, Giải trí, Khác.
- Trang Hôm nay tổng kết thu nhập/chi phí thực tế của tháng hiện tại.

## Chạy local

Không cần build step:

```bash
python3 -m http.server 8080
```

Mở `http://localhost:8080`.

## Tests

```bash
npm test
```

## Buffer

Rootcash sắp xếp các dòng tiền theo ngày. Nếu thu và chi trùng ngày, nghĩa vụ chi được xét trước để bảo thủ. Công thức:

`buffer = roundUp(max cumulative deficit + safetyRate × plannedExpense, 500.000đ)`

Mặc định `safetyRate = 10%` và có thể chỉnh trong Cài đặt.

## PWA

- Accent: `#BAFF9C`
- Homescreen icon có safe padding riêng.
- Splash tối giản, không halo/ring.
- Hỗ trợ `prefers-reduced-motion`.
- `© 2026 Rootcash`.
