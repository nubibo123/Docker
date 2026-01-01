# Docker Builder App

Ứng dụng web tự động build và đóng gói Docker images với giao diện đồ họa.

## 🚀 Tính năng

- ✅ Build Docker images từ Dockerfile
- ✅ Quản lý Docker images (xem, xóa, export)
- ✅ Export images thành file .tar
- ✅ Quản lý containers (start, stop, remove)
- ✅ Chạy containers từ images
- ✅ Giao diện web hiện đại và thân thiện
- ✅ Real-time Docker daemon status

## 📋 Yêu cầu

- Node.js (v14 trở lên)
- Docker đã được cài đặt và đang chạy
- Docker daemon phải có thể truy cập được

## 🔧 Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Khởi động server:
```bash
npm start
```

Hoặc chạy ở chế độ development với auto-reload:
```bash
npm run dev
```

3. Mở trình duyệt và truy cập:
```
http://localhost:3000
```

## 📖 Hướng dẫn sử dụng

### Build Docker Image

1. Chọn file Dockerfile từ máy của bạn
2. Nhập tên image và tag (mặc định: latest)
3. Click "Build Image"
4. Xem logs build real-time
5. Image sẽ tự động xuất hiện trong danh sách

### Export Docker Image

1. Tìm image muốn export trong danh sách
2. Click nút "📥 Export"
3. Xác nhận export
4. File .tar sẽ tự động được download

### Quản lý Containers

1. Click "▶️ Run" để chạy container từ image
2. Nhập tên container (hoặc để trống)
3. Sử dụng "⏸️ Stop" để dừng container đang chạy
4. Sử dụng "🗑️ Xóa" để xóa container

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Images
```
GET /api/images                    # Lấy danh sách images
POST /api/build                    # Build image từ Dockerfile
POST /api/export                   # Export image thành .tar
DELETE /api/images/:id             # Xóa image
```

### Containers
```
GET /api/containers                # Lấy danh sách containers
POST /api/containers/start         # Chạy container từ image
POST /api/containers/:id/stop      # Dừng container
DELETE /api/containers/:id         # Xóa container
```

## 📁 Cấu trúc thư mục

```
Docker/
├── server.js              # Backend Express server
├── package.json           # Dependencies
├── public/                # Frontend files
│   ├── index.html        # Giao diện chính
│   ├── app.css           # Styles
│   └── app.js            # Frontend logic
├── uploads/              # Dockerfile uploads (auto-created)
├── exports/              # Exported images (auto-created)
└── README.md             # Tài liệu
```

## 🛠️ Technologies

- **Backend:** Node.js, Express, Dockerode
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Docker:** Docker Engine API
- **File Handling:** Multer, Archiver, Tar-stream

## ⚠️ Lưu ý

- Đảm bảo Docker daemon đang chạy trước khi khởi động app
- Trên Linux, user cần có quyền truy cập Docker socket
- File exports có thể chiếm nhiều dung lượng đĩa
- Xóa các file export định kỳ để tiết kiệm không gian

## 🔐 Docker Socket Permission (Linux)

Nếu gặp lỗi permission với Docker socket:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 🐛 Xử lý lỗi thường gặp

**"Cannot connect to Docker daemon"**
- Kiểm tra Docker đang chạy: `docker ps`
- Kiểm tra quyền truy cập Docker socket

**"Build failed"**
- Kiểm tra Dockerfile syntax
- Xem build logs để biết chi tiết lỗi

**"Export failed"**
- Kiểm tra dung lượng đĩa còn trống
- Đảm bảo có quyền ghi vào thư mục exports

## 📝 License

MIT

## 👨‍💻 Author

Created with ❤️ for Docker automation
