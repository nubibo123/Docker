#!/bin/bash

# Script tự động build và chạy Docker container cho website

echo "🐳 Docker Build Script cho Website"
echo "=================================="

# Tên image và container
IMAGE_NAME="my-website"
CONTAINER_NAME="my-website-container"
PORT="8080"

# Hàm hiển thị menu
show_menu() {
    echo ""
    echo "Chọn hành động:"
    echo "1) Build Docker image"
    echo "2) Run container"
    echo "3) Build và Run"
    echo "4) Stop container"
    echo "5) Remove container"
    echo "6) Remove image"
    echo "7) View logs"
    echo "8) Export image thành .tar"
    echo "9) Rebuild (stop, remove, build, run)"
    echo "0) Thoát"
    echo ""
}

# Build image
build_image() {
    echo "📦 Building Docker image..."
    docker build -t $IMAGE_NAME:latest .
    if [ $? -eq 0 ]; then
        echo "✅ Build thành công!"
        docker images | grep $IMAGE_NAME
    else
        echo "❌ Build thất bại!"
        exit 1
    fi
}

# Run container
run_container() {
    echo "🚀 Starting container..."
    
    # Check nếu container đang chạy
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        echo "⚠️  Container đang chạy. Stopping..."
        docker stop $CONTAINER_NAME
    fi
    
    # Remove container cũ nếu tồn tại
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        echo "🗑️  Removing old container..."
        docker rm $CONTAINER_NAME
    fi
    
    # Run container mới
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container đang chạy!"
        echo "🌐 Truy cập website tại: http://localhost:$PORT"
        docker ps | grep $CONTAINER_NAME
    else
        echo "❌ Không thể start container!"
        exit 1
    fi
}

# Stop container
stop_container() {
    echo "⏸️  Stopping container..."
    docker stop $CONTAINER_NAME
    echo "✅ Container đã dừng!"
}

# Remove container
remove_container() {
    echo "🗑️  Removing container..."
    docker rm -f $CONTAINER_NAME 2>/dev/null
    echo "✅ Container đã xóa!"
}

# Remove image
remove_image() {
    echo "🗑️  Removing image..."
    docker rmi -f $IMAGE_NAME:latest 2>/dev/null
    echo "✅ Image đã xóa!"
}

# View logs
view_logs() {
    echo "📋 Container logs:"
    docker logs -f $CONTAINER_NAME
}

# Export image
export_image() {
    EXPORT_FILE="${IMAGE_NAME}-$(date +%Y%m%d-%H%M%S).tar"
    echo "📥 Exporting image to $EXPORT_FILE..."
    docker save -o $EXPORT_FILE $IMAGE_NAME:latest
    if [ $? -eq 0 ]; then
        echo "✅ Export thành công!"
        ls -lh $EXPORT_FILE
    else
        echo "❌ Export thất bại!"
    fi
}

# Rebuild all
rebuild_all() {
    echo "🔄 Rebuilding everything..."
    stop_container
    remove_container
    remove_image
    build_image
    run_container
    echo "✅ Rebuild hoàn tất!"
}

# Main loop
while true; do
    show_menu
    read -p "Nhập lựa chọn: " choice
    
    case $choice in
        1)
            build_image
            ;;
        2)
            run_container
            ;;
        3)
            build_image
            run_container
            ;;
        4)
            stop_container
            ;;
        5)
            remove_container
            ;;
        6)
            remove_image
            ;;
        7)
            view_logs
            ;;
        8)
            export_image
            ;;
        9)
            rebuild_all
            ;;
        0)
            echo "👋 Tạm biệt!"
            exit 0
            ;;
        *)
            echo "❌ Lựa chọn không hợp lệ!"
            ;;
    esac
    
    read -p "Nhấn Enter để tiếp tục..."
done
