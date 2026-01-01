# Calculator Website

Máy tính đơn giản với giao diện đẹp.

## Tính năng
- Cộng, trừ, nhân, chia
- Phần trăm
- Hỗ trợ bàn phím
- Responsive design

## Build và Run

### Từ Terminal:
```bash
cd /home/lequangchinh/Docker/calculator
docker build -t calculator-web .
docker run -d -p 8083:80 --name calculator calculator-web
```

### Từ Docker Builder App:
1. Mở http://localhost:3000
2. Upload tất cả files: Dockerfile, index.html, style.css, script.js
3. Nhập tên image: calculator-web
4. Click "Build Image"
5. Click "Run" trên image vừa build

## Truy cập
- Mở trình duyệt: http://localhost:8083

## Phím tắt
- Số 0-9: Nhập số
- +, -, *, /: Phép tính
- Enter hoặc =: Tính kết quả
- Backspace: Xóa 1 ký tự
- Escape: Clear tất cả
- %: Phần trăm
