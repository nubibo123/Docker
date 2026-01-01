# Website Docker Build

Website tĩnh được đóng gói với Docker và Nginx.

## 🚀 Cách sử dụng nhanh

### Sử dụng script tự động (Khuyên dùng):
```bash
chmod +x build.sh
./build.sh
```

Script cung cấp menu với các tùy chọn:
1. Build Docker image
2. Run container
3. Build và Run (all-in-one)
4. Stop container
5. Remove container
6. Remove image
7. View logs
8. Export image
9. Rebuild toàn bộ

### Hoặc sử dụng Docker commands:

**Build image:**
```bash
docker build -t my-website .
```

**Run container:**
```bash
docker run -d --name my-website-container -p 8080:80 my-website
```

**Truy cập website:**
```
http://localhost:8080
```

### Hoặc sử dụng Docker Compose:

```bash
docker-compose up -d
```

## 📋 Files

- `Dockerfile` - Cấu hình Docker image với Nginx
- `nginx.conf` - Cấu hình Nginx server
- `docker-compose.yml` - Docker Compose configuration
- `build.sh` - Script bash tự động hóa
- `index.html`, `style.css`, `script.js` - Website files

## 🛠️ Commands hữu ích

```bash
# Stop container
docker stop my-website-container

# View logs
docker logs my-website-container

# Remove container
docker rm my-website-container

# Remove image
docker rmi my-website

# Export image
docker save -o my-website.tar my-website:latest

# Import image
docker load -i my-website.tar
```

## 🔧 Tính năng

- ✅ Nginx Alpine (image nhỏ gọn ~25MB)
- ✅ Gzip compression
- ✅ Cache static files
- ✅ Security headers
- ✅ Health check
- ✅ Auto restart
- ✅ Custom nginx config

## 📦 Kích thước

- Base image: nginx:alpine (~25MB)
- Final image: ~26MB
- Container: ~1MB RAM
