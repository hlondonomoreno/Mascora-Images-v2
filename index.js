const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { getDominantColor, mixColors } = require('./utils/colors');

const app = express();
const port = process.env.PORT || 3000;

// Ruta pública para acceder a imágenes procesadas
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Configurar Multer para manejar la carga de imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/process', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
  }

  try {
    // Crear carpeta 'processed' si no existe
    const processedDir = path.join(__dirname, 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir);
    }

    const image = await loadImage(req.file.buffer);

    const width = 1000;
    const height = 700;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Obtener color base y mezclar con fondo deseado
    const dominant = getDominantColor(image);
    const baseColor = mixColors(dominant, '#ff9e00ff');

    // Crear fondo degradado desde imagen hacia color base (4 lados)
    const blurCanvas = createCanvas(image.width, image.height);
    const blurCtx = blurCanvas.getContext('2d');

    blurCtx.drawImage(image, 0, 0, image.width, image.height);
    const blurredImage = blurCanvas;

    // Llenar fondo con imagen desenfocada (simulada) y luego overlay del degradado
    ctx.drawImage(blurredImage, 0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, baseColor + '00'); // Transparente

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Calcular posición para centrar la imagen original
    const x = (width - image.width) / 2;
    const y = (height - image.height) / 2;
    ctx.drawImage(image, x, y);

    const filename = `processed/${Date.now()}.jpg`;
    const outPath = path.join(__dirname, filename);

    const out = fs.createWriteStream(outPath);
    const stream = canvas.createJPEGStream({ quality: 0.95 });

    stream.pipe(out);

    out.on('finish', () => {
      res.json({
        status: 'success',
        url: `${req.protocol}://${req.get('host')}/${filename.replace(/\\/g, '/')}`,
      });
    });

    out.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ status: 'error', message: 'Image write failed.' });
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Processing failed.',
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
