const API_URL = 'http://localhost:3000/api';
let selectedImageForExport = null;

// Check Docker daemon status
async function checkDockerStatus() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        const statusEl = document.getElementById('dockerStatus');
        
        if (data.status === 'OK') {
            statusEl.className = 'status connected';
            statusEl.innerHTML = '<span class="status-indicator"></span><span>Docker đang chạy</span>';
        } else {
            statusEl.className = 'status error';
            statusEl.innerHTML = '<span class="status-indicator"></span><span>Docker lỗi</span>';
        }
    } catch (error) {
        const statusEl = document.getElementById('dockerStatus');
        statusEl.className = 'status error';
        statusEl.innerHTML = '<span class="status-indicator"></span><span>Không thể kết nối</span>';
    }
}

// Load Docker images
async function loadImages() {
    const container = document.getElementById('imagesList');
    container.innerHTML = '<p class="loading">Đang tải...</p>';
    
    try {
        const response = await fetch(`${API_URL}/images`);
        const images = await response.json();
        
        if (images.length === 0) {
            container.innerHTML = '<p class="loading">Chưa có image nào</p>';
            return;
        }
        
        container.innerHTML = images.map(image => {
            const repoTags = image.RepoTags || ['<none>:<none>'];
            const size = (image.Size / 1024 / 1024).toFixed(2);
            const created = new Date(image.Created * 1000).toLocaleDateString('vi-VN');
            const imageName = (repoTags[0] && repoTags[0] !== '<none>:<none>') 
                ? repoTags[0].split(':')[0] 
                : 'image';
            
            return `
                <div class="list-item">
                    <div class="item-info">
                        <h3>${repoTags[0]}</h3>
                        <p><strong>ID:</strong> ${image.Id.substring(7, 19)}</p>
                        <p><strong>Kích thước:</strong> ${size} MB</p>
                        <p><strong>Tạo lúc:</strong> ${created}</p>
                        <div id="files-${image.Id.substring(7, 19)}" class="image-files"></div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-info" onclick="viewImageFiles('${image.Id}')">
                            📂 Xem Files
                        </button>
                        <button class="btn btn-info" onclick="exportImage('${image.Id}', '${imageName}')">
                            📥 Export
                        </button>
                        <button class="btn btn-success" onclick="runContainer('${image.Id}')">
                            ▶️ Run
                        </button>
                        <button class="btn btn-danger" onclick="deleteImage('${image.Id}')">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p class="loading">❌ Lỗi khi tải images</p>';
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Load Docker containers
async function loadContainers() {
    const container = document.getElementById('containersList');
    container.innerHTML = '<p class="loading">Đang tải...</p>';
    
    try {
        const response = await fetch(`${API_URL}/containers`);
        const containers = await response.json();
        
        if (containers.length === 0) {
            container.innerHTML = '<p class="loading">Chưa có container nào</p>';
            return;
        }
        
        container.innerHTML = containers.map(cont => {
            const name = cont.Names[0].replace('/', '');
            const status = cont.State;
            const image = cont.Image;
            
            // Lấy public port đầu tiên để mở web
            const publicPort = cont.Ports.find(p => p.PublicPort)?.PublicPort;
            const ports = cont.Ports.map(p => 
                p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort
            ).join(', ') || 'Không có';
            
            return `
                <div class="list-item">
                    <div class="item-info">
                        <h3>${name}</h3>
                        <p><strong>Image:</strong> ${image}</p>
                        <p><strong>ID:</strong> ${cont.Id.substring(0, 12)}</p>
                        <p><strong>Trạng thái:</strong> <span style="color: ${status === 'running' ? '#4caf50' : '#f44336'}">${status}</span></p>
                        <p><strong>Ports:</strong> ${ports}</p>
                    </div>
                    <div class="item-actions">
                        ${status === 'running' && publicPort ? 
                            `<button class="btn btn-info" onclick="openWeb(${publicPort})">🌐 Mở Web</button>` : ''
                        }
                        ${status === 'running' ? 
                            `<button class="btn btn-warning" onclick="stopContainer('${cont.Id}')">⏸️ Stop</button>` :
                            `<button class="btn btn-success" onclick="startContainer('${cont.Id}')">▶️ Start</button>`
                        }
                        <button class="btn btn-danger" onclick="deleteContainer('${cont.Id}')">🗑️ Xóa</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<p class="loading">❌ Lỗi khi tải containers</p>';
        showToast('Lỗi: ' + error.message, 'error');
    }
}

// Build Docker image
document.getElementById('buildForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const buildOutput = document.getElementById('buildOutput');
    const buildLogs = document.getElementById('buildLogs');
    
    buildOutput.classList.remove('hidden');
    buildLogs.textContent = 'Đang build image...\n';
    
    try {
        const response = await fetch(`${API_URL}/build`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            buildLogs.textContent = data.logs || 'Build thành công!';
            showToast(data.message, 'success');
            setTimeout(() => loadImages(), 1000);
        } else {
            buildLogs.textContent = 'Lỗi: ' + (data.error || 'Unknown error');
            showToast('Build thất bại!', 'error');
        }
    } catch (error) {
        buildLogs.textContent = 'Lỗi: ' + error.message;
        showToast('Lỗi khi build: ' + error.message, 'error');
    }
});

// Export image
function exportImage(imageId, imageName) {
    selectedImageForExport = { imageId, imageName };
    document.getElementById('exportModal').classList.add('show');
}

async function confirmExport() {
    closeModal();
    showToast('Đang export image...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selectedImageForExport)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Export thành công!', 'success');
            
            // Auto download - data.downloadUrl đã có /api/ rồi
            window.open(data.downloadUrl, '_blank');
        } else {
            showToast('Export thất bại: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi export: ' + error.message, 'error');
    }
}

// Delete image
async function deleteImage(imageId) {
    if (!confirm('Bạn có chắc muốn xóa image này?')) return;
    
    try {
        const response = await fetch(`${API_URL}/images/${imageId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadImages();
        } else {
            showToast('Lỗi: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi xóa: ' + error.message, 'error');
    }
}

// Run container from image
async function runContainer(imageId) {
    const containerName = prompt('Nhập tên container (để trống để tự động tạo):');
    
    try {
        const response = await fetch(`${API_URL}/containers/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageId, containerName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            setTimeout(() => loadContainers(), 1000);
        } else {
            showToast('Lỗi: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi chạy container: ' + error.message, 'error');
    }
}

// Stop container
async function stopContainer(containerId) {
    try {
        const response = await fetch(`${API_URL}/containers/${containerId}/stop`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadContainers();
        } else {
            showToast('Lỗi: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi dừng container: ' + error.message, 'error');
    }
}

// Start container
async function startContainer(containerId) {
    try {
        const response = await fetch(`${API_URL}/containers/${containerId}/start`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadContainers();
        } else {
            showToast('Lỗi: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi khởi động container: ' + error.message, 'error');
    }
}

// Delete container
async function deleteContainer(containerId) {
    if (!confirm('Bạn có chắc muốn xóa container này?')) return;
    
    try {
        const response = await fetch(`${API_URL}/containers/${containerId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            loadContainers();
        } else {
            showToast('Lỗi: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi xóa: ' + error.message, 'error');
    }
}

// Open web in new tab
function openWeb(port) {
    const url = `http://localhost:${port}`;
    window.open(url, '_blank');
    showToast(`Đang mở web tại port ${port}...`, 'info');
}

// View files in image
async function viewImageFiles(imageId) {
    const shortId = imageId.substring(7, 19);
    const filesContainer = document.getElementById(`files-${shortId}`);
    
    // Toggle visibility
    if (filesContainer.style.display === 'block') {
        filesContainer.style.display = 'none';
        return;
    }
    
    filesContainer.innerHTML = '<p style="color: #666; font-size: 12px;">🔍 Đang kiểm tra files...</p>';
    filesContainer.style.display = 'block';
    
    try {
        const response = await fetch(`/api/images/${imageId}/files`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Lỗi khi lấy danh sách files');
        
        if (data.files && data.files.length > 0) {
            const fileList = data.files.map(file => `  • ${file}`).join('\n');
            filesContainer.innerHTML = `
                <div style="margin-top: 10px; padding: 12px; background: #f8f9fa; border-left: 3px solid #667eea; border-radius: 4px;">
                    <strong style="font-size: 13px; color: #333;">📁 Nội dung trong /usr/share/nginx/html:</strong>
                    <div style="margin-top: 8px; font-family: 'Courier New', monospace; font-size: 12px; color: #555; line-height: 1.6; white-space: pre-wrap;">${fileList}</div>
                    ${data.files.length === 0 ? '<p style="color: #e74c3c; font-size: 12px; margin-top: 5px;">⚠️ Thư mục trống - có thể gây lỗi nginx default page</p>' : ''}
                </div>
            `;
        } else {
            filesContainer.innerHTML = '<p style="color: #e74c3c; font-size: 12px;">⚠️ Không tìm thấy files - Image có thể bị lỗi</p>';
        }
    } catch (error) {
        filesContainer.innerHTML = `<p style="color: #e74c3c; font-size: 12px;">❌ ${error.message}</p>`;
    }
}

// Modal functions
function closeModal() {
    document.getElementById('exportModal').classList.remove('show');
}

// Import image functions
function showImportModal() {
    document.getElementById('importModal').classList.add('show');
    document.getElementById('importForm').reset();
    document.getElementById('importProgress').classList.add('hidden');
    document.getElementById('importProgressBar').style.width = '0%';
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
}

// Import form submission
document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    const imageName = document.getElementById('importImageName').value.trim();
    const imageTag = document.getElementById('importImageTag').value.trim() || 'latest';
    
    if (!file) {
        showToast('Vui lòng chọn file .tar', 'error');
        return;
    }
    
    if (!imageName) {
        showToast('Vui lòng nhập tên image', 'error');
        return;
    }
    
    // Show progress
    document.getElementById('importProgress').classList.remove('hidden');
    document.getElementById('importProgressBar').style.width = '30%';
    
    const formData = new FormData();
    formData.append('imageFile', file);
    formData.append('imageName', imageName);
    formData.append('imageTag', imageTag);
    
    try {
        showToast('Đang import image...', 'info');
        document.getElementById('importProgressBar').style.width = '60%';
        
        const response = await fetch(`${API_URL}/import`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        document.getElementById('importProgressBar').style.width = '100%';
        
        if (data.success) {
            showToast(`Import thành công: ${imageName}:${imageTag}`, 'success');
            closeImportModal();
            setTimeout(() => loadImages(), 1000);
        } else {
            showToast('Import thất bại: ' + data.error, 'error');
        }
    } catch (error) {
        showToast('Lỗi khi import: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            document.getElementById('importProgress').classList.add('hidden');
            document.getElementById('importProgressBar').style.width = '0%';
        }, 1000);
    }
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkDockerStatus();
    loadImages();
    loadContainers();
    
    // Refresh every 30 seconds
    setInterval(() => {
        checkDockerStatus();
    }, 30000);
});
