# 🐍 Snake Game

Trò chơi rắn săn mồi cổ điển với HTML, CSS và JavaScript.

## 🚀 Cách build qua Docker Builder App (http://localhost:3000)

### ⚠️ QUAN TRỌNG: Phải upload TẤT CẢ files cùng lúc!

1. **Mở form Build Docker Image**

2. **Chọn Dockerfile:** 
   - Click "Choose File"
   - Chọn `Dockerfile` từ thư mục `snake-game`

3. **Upload thêm các files (QUAN TRỌNG!):**
   - Browser có thể không cho chọn nhiều files cùng lúc
   - Giải pháp: Tạo 1 form upload file riêng hoặc dùng terminal

### 💡 Giải pháp tốt nhất:

**Cách 1: Build từ terminal** (Đơn giản nhất)
```bash
cd /home/lequangchinh/Docker/snake-game
docker build -t snake-game .
docker run -d --name snake-game -p 8082:80 snake-game
```

**Cách 2: Sử dụng script tự động**
```bash
cd /home/lequangchinh/Docker/snake-game
./build.sh
# Chọn option 3: Build và Run
```

**Cách 3: Zip tất cả files**
1. Tạo file zip chứa: Dockerfile + index.html + style.css + script.js
2. Upload file zip vào Docker Builder App
3. App sẽ extract và build

## 🌐 Truy cập:

- **Snake Game:** http://localhost:8082 (hoặc port được assign tự động)
- **My Website:** http://localhost:8080
- **Calculator:** http://localhost:8081

## 🎮 Cách chơi:

- ⬆️⬇️⬅️➡️ Dùng phím mũi tên để điều khiển
- 🍎 Ăn táo để tăng điểm
- ⚠️ Không đâm vào tường hoặc thân mình

## 📋 Files trong project:

```
snake-game/
├── Dockerfile          # Docker config
├── index.html          # HTML game
├── style.css           # Styles
├── script.js           # Game logic
├── build.sh            # Build script
├── .dockerignore       # Ignore files
└── README.md           # Hướng dẫn
```

## 🔧 Vấn đề thường gặp:

**Q: Tại sao build qua app chỉ thấy giao diện nginx mặc định?**
A: Vì chỉ upload Dockerfile mà không upload các file HTML/CSS/JS. Dockerfile cần tất cả files trong context để COPY vào container.

**Q: Làm sao upload nhiều files cùng lúc?**
A: HTML file input mặc định chỉ cho chọn 1 file. Cần sửa backend để chấp nhận multiple files hoặc dùng terminal.

## 💪 Build thành công khi:

✅ Có đủ 4 files: Dockerfile + index.html + style.css + script.js
✅ Build từ thư mục chứa tất cả files
✅ Container có đầy đủ files trong /usr/share/nginx/html/
