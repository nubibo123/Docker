const express = require('express');
const multer = require('multer');
const Docker = require('dockerode');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const tar = require('tar-stream');
const cors = require('cors');

const app = express();
const docker = new Docker();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// API: Lấy danh sách images
app.get('/api/images', async (req, res) => {
    try {
        const images = await docker.listImages();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Lấy danh sách containers
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: true });
        res.json(containers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Build Docker image từ Dockerfile
app.post('/api/build', upload.fields([
    { name: 'dockerfile', maxCount: 1 },
    { name: 'additionalFiles', maxCount: 20 }
]), async (req, res) => {
    try {
        const { imageName, imageTag } = req.body;
        const dockerfileFile = req.files['dockerfile'] ? req.files['dockerfile'][0] : null;
        const additionalFiles = req.files['additionalFiles'] || [];

        if (!imageName) {
            return res.status(400).json({ error: 'Tên image là bắt buộc' });
        }

        if (!dockerfileFile) {
            return res.status(400).json({ error: 'Dockerfile là bắt buộc' });
        }

        // Tạo tar stream với tất cả files
        const pack = tar.pack();
        
        // Add Dockerfile
        const dockerfileContent = fs.readFileSync(dockerfileFile.path);
        pack.entry({ name: 'Dockerfile' }, dockerfileContent);
        
        // Add additional files
        additionalFiles.forEach(file => {
            const fileContent = fs.readFileSync(file.path);
            pack.entry({ name: file.originalname }, fileContent);
        });
        
        pack.finalize();

        const fullImageName = `${imageName}:${imageTag || 'latest'}`;

        // Build image
        const stream = await docker.buildImage(pack, {
            t: fullImageName
        });

        // Stream build output
        let buildLogs = '';
        stream.on('data', (chunk) => {
            const data = chunk.toString();
            buildLogs += data;
            console.log(data);
        });

        stream.on('end', () => {
            // Xóa files tạm
            fs.unlinkSync(dockerfileFile.path);
            additionalFiles.forEach(file => {
                fs.unlinkSync(file.path);
            });
            
            res.json({ 
                success: true, 
                message: `Image ${fullImageName} đã được build thành công!`,
                logs: buildLogs 
            });
        });

        stream.on('error', (error) => {
            res.status(500).json({ error: error.message });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Xuất Docker image thành file .tar
app.post('/api/export', async (req, res) => {
    try {
        const { imageId, imageName } = req.body;

        if (!imageId) {
            return res.status(400).json({ error: 'Image ID là bắt buộc' });
        }

        const image = docker.getImage(imageId);
        const stream = await image.get();

        const fileName = `${imageName || 'docker-image'}-${Date.now()}.tar`;
        const exportDir = './exports';
        
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const filePath = path.join(exportDir, fileName);
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        writeStream.on('finish', () => {
            res.json({ 
                success: true, 
                message: 'Image đã được export thành công!',
                fileName: fileName,
                downloadUrl: `/api/download/${fileName}`
            });
        });

        writeStream.on('error', (error) => {
            res.status(500).json({ error: error.message });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Download exported image
app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'exports', req.params.filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File không tồn tại' });
    }

    res.download(filePath);
});

// API: Import Docker image from .tar file
app.post('/api/import', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file nào được upload' });
        }

        const filePath = req.file.path;
        const imageName = req.body.imageName || 'imported-image';
        const imageTag = req.body.imageTag || 'latest';

        // Load image from tar file
        const imageStream = fs.createReadStream(filePath);
        const loadResult = await docker.loadImage(imageStream);

        // Get the imported image ID from load result
        let importedImageId = null;
        if (loadResult && loadResult.length > 0) {
            const lastMessage = loadResult[loadResult.length - 1];
            if (lastMessage.stream) {
                const match = lastMessage.stream.match(/Loaded image: (.+)/);
                if (match) {
                    importedImageId = match[1];
                } else {
                    // Try to get ID from earlier messages
                    for (const msg of loadResult) {
                        if (msg.stream && msg.stream.includes('sha256:')) {
                            const idMatch = msg.stream.match(/sha256:([a-f0-9]+)/);
                            if (idMatch) {
                                importedImageId = 'sha256:' + idMatch[1];
                                break;
                            }
                        }
                    }
                }
            }
        }

        // Tag the image with custom name
        if (importedImageId) {
            const image = docker.getImage(importedImageId);
            await image.tag({
                repo: imageName,
                tag: imageTag
            });
        } else {
            // If we can't find the image ID, try to get the latest image
            const images = await docker.listImages();
            if (images.length > 0) {
                const latestImage = images[0];
                await docker.getImage(latestImage.Id).tag({
                    repo: imageName,
                    tag: imageTag
                });
            }
        }

        // Delete uploaded file after import
        fs.unlinkSync(filePath);

        res.json({ 
            success: true, 
            message: `Image đã được import và đặt tên: ${imageName}:${imageTag}`,
            imageName: `${imageName}:${imageTag}`
        });
    } catch (error) {
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete image
app.delete('/api/images/:id', async (req, res) => {
    try {
        const image = docker.getImage(req.params.id);
        await image.remove({ force: true });
        res.json({ success: true, message: 'Image đã được xóa!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get files in image
app.get('/api/images/:id/files', async (req, res) => {
    try {
        const imageId = req.params.id;
        
        // Create a temporary container from the image
        const container = await docker.createContainer({
            Image: imageId,
            Cmd: ['sh', '-c', 'ls -lah /usr/share/nginx/html/ 2>/dev/null || ls -lah /app/ 2>/dev/null || echo "Không tìm thấy thư mục"'],
            AttachStdout: true,
            AttachStderr: true
        });

        // Start and wait for the container
        await container.start();
        await container.wait();

        // Get logs (output of ls command)
        const logs = await container.logs({
            stdout: true,
            stderr: true
        });

        // Clean up
        await container.remove();

        // Parse the output
        const output = logs.toString('utf-8');
        const lines = output.split('\n').filter(line => line.trim().length > 0);
        
        // Skip the first line (total) and format the output
        const files = lines.slice(1).map(line => {
            // Parse ls -lah output: permissions user group size date time name
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 9) {
                const permissions = parts[0];
                const size = parts[4];
                const name = parts.slice(8).join(' ');
                
                // Skip . and .. directories
                if (name === '.' || name === '..') return null;
                
                // Format: filename (size) [type]
                let type = '';
                if (permissions.startsWith('d')) type = '📁 Folder';
                else if (name.endsWith('.html')) type = '📄 HTML';
                else if (name.endsWith('.css')) type = '🎨 CSS';
                else if (name.endsWith('.js')) type = '⚡ JS';
                else type = '📄 File';
                
                return `${type}: ${name} (${size})`;
            }
            return line;
        }).filter(line => line !== null);

        res.json({ success: true, files, raw: output });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function: Tìm port khả dụng
async function findAvailablePort(startPort = 8080) {
    const containers = await docker.listContainers({ all: true });
    const usedPorts = new Set();
    
    // Lấy tất cả ports đang được sử dụng
    containers.forEach(container => {
        container.Ports.forEach(port => {
            if (port.PublicPort) {
                usedPorts.add(port.PublicPort);
            }
        });
    });
    
    // Port của Docker Builder App
    usedPorts.add(3000);
    
    // Tìm port khả dụng
    let port = startPort;
    while (usedPorts.has(port)) {
        port++;
    }
    
    return port;
}

// API: Start container từ image
app.post('/api/containers/start', async (req, res) => {
    try {
        const { imageId, containerName } = req.body;
        
        // Tự động tìm port khả dụng
        const availablePort = await findAvailablePort(8080);

        const container = await docker.createContainer({
            Image: imageId,
            name: containerName || `container-${Date.now()}`,
            HostConfig: {
                PortBindings: {
                    '80/tcp': [{ HostPort: availablePort.toString() }]
                }
            },
            ExposedPorts: {
                '80/tcp': {}
            }
        });

        await container.start();

        res.json({ 
            success: true, 
            message: `Container đã được khởi động trên port ${availablePort}!`,
            containerId: container.id,
            port: availablePort
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Stop container
app.post('/api/containers/:id/stop', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.stop();
        res.json({ success: true, message: 'Container đã được dừng!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Start stopped container
app.post('/api/containers/:id/start', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.start();
        res.json({ success: true, message: 'Container đã được khởi động!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Remove container
app.delete('/api/containers/:id', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        await container.remove({ force: true });
        res.json({ success: true, message: 'Container đã được xóa!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await docker.ping();
        res.json({ status: 'OK', message: 'Docker daemon đang chạy' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', message: 'Không thể kết nối với Docker daemon' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📦 Docker Builder App đã sẵn sàng!`);
});
