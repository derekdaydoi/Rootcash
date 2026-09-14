# Rootcash

Rootcash là một PWA local-first để lập kế hoạch tài chính theo tháng.

- Ngày 20: nhập thủ công thu nhập dự kiến + ngày nhận.
- Nhập các khoản chi dự kiến + ngày phải trả.
- Rootcash tính buffer theo khoảng hụt dòng tiền theo ngày + biên an toàn.
- Phân bổ phần linh hoạt vào đúng 9 nhóm: Yêu đương, Ăn uống, Thể thao, Xăng xe, Dịch vụ nhà, Mua sắm, AI và học tập, Trading, Invest.
- Trang Hôm nay tổng kết thu nhập, chi phí và cơ cấu chi tiêu thực tế tháng hiện tại.
- Dữ liệu lưu local-first; hỗ trợ nhập/xuất JSON, xóa từng mục và xóa toàn bộ dữ liệu.

## Chạy local

```bash
python3 -m http.server 8080
```

Mở `http://localhost:8080`.

## Tests

```bash
node tests/domain.test.js
```

## Buffer

Rootcash sắp xếp dòng tiền theo ngày. Nếu thu và chi trùng ngày, nghĩa vụ chi được xét trước để bảo thủ:

`buffer = roundUp(max cumulative deficit + safetyRate × plannedExpense, 500.000đ)`

Mặc định `safetyRate = 10%` và có thể chỉnh trong Cài đặt.

## PWA / Brand

- Accent: `#BAFF9C`.
- Một logo canonical dùng cho splash, header và homescreen icon.
- Homescreen icon có safe padding riêng cho iOS Add to Home Screen.
- Splash dùng fade + scale nhẹ, không halo/ring, có `© 2026 Rootcash`.
- Bottom navigation cố định, tách khỏi vùng scroll.
- Khóa pinch zoom và overscroll/rubber-band trong app shell.
- Hỗ trợ `prefers-reduced-motion`.
