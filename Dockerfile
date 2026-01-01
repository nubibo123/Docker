FROM nginx:alpine

# Xóa default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy all files từ context vào nginx html
COPY . /usr/share/nginx/html/

# Set permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
