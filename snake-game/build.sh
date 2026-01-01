#!/bin/bash

# Script build và chạy Snake Game

IMAGE_NAME="snake-game"
CONTAINER_NAME="snake-game-container"
PORT="8082"

echo "🐍 Snake Game - Docker Build Script"
echo "===================================="

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
    echo "8) Rebuild all"
    echo "0) Thoát"
    echo ""
}

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

run_container() {
    echo "🚀 Starting container..."
    
    if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
        echo "⏸️  Stopping running container..."
        docker stop $CONTAINER_NAME
    fi
    
    if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
        echo "🗑️  Removing old container..."
        docker rm $CONTAINER_NAME
    fi
    
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        --restart unless-stopped \
        $IMAGE_NAME:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container đang chạy!"
        echo "🌐 Truy cập game tại: http://localhost:$PORT"
        docker ps | grep $CONTAINER_NAME
    else
        echo "❌ Không thể start container!"
        exit 1
    fi
}

stop_container() {
    echo "⏸️  Stopping container..."
    docker stop $CONTAINER_NAME 2>/dev/null
    echo "✅ Container đã dừng!"
}

remove_container() {
    echo "🗑️  Removing container..."
    docker rm -f $CONTAINER_NAME 2>/dev/null
    echo "✅ Container đã xóa!"
}

remove_image() {
    echo "🗑️  Removing image..."
    docker rmi -f $IMAGE_NAME:latest 2>/dev/null
    echo "✅ Image đã xóa!"
}

view_logs() {
    echo "📋 Container logs:"
    docker logs -f $CONTAINER_NAME
}

rebuild_all() {
    echo "🔄 Rebuilding everything..."
    stop_container
    remove_container
    remove_image
    build_image
    run_container
    echo "✅ Rebuild hoàn tất!"
}

while true; do
    show_menu
    read -p "Nhập lựa chọn: " choice
    
    case $choice in
        1) build_image ;;
        2) run_container ;;
        3) build_image && run_container ;;
        4) stop_container ;;
        5) remove_container ;;
        6) remove_image ;;
        7) view_logs ;;
        8) rebuild_all ;;
        0) echo "👋 Tạm biệt!"; exit 0 ;;
        *) echo "❌ Lựa chọn không hợp lệ!" ;;
    esac
    
    read -p "Nhấn Enter để tiếp tục..."
done
