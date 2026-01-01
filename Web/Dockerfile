# Build stage - sử dụng Nginx để serve static files
FROM nginx:alpine

# Metadata
LABEL maintainer="Docker Builder App"
LABEL description="Static website với HTML, CSS, JavaScript"

# Xóa default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy tất cả files từ context (bao gồm HTML, CSS, JS)
# Khi build qua app: upload Dockerfile + index.html + style.css + script.js cùng lúc
COPY . /usr/share/nginx/html/

# Set permissions
RUN chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
