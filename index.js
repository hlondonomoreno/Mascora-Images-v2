const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { generateGradientCanvas } = require('./utils/colors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const image = await Jimp.read(file.path);
    const targetWidth = 1000;
    const targetHeight = 700;

    // Calcula escala para mantener aspecto
    const scale = Math.min(targetWidth / image.bitmap.width, targetHeight / image.bitmap.height);
    const newWidth = Math.round(image.bitmap.width * scale);
    const newHeight = Math.round(image.bitmap.height * scale);

    image.resize(newWidth, newHeight);

    // Genera fondo con desenfoque extendido
    const background = await generateGradientCanvas(image, targetWidth, targetHeight);

    const x = Math.floor((targetWidth - newWidth) / 2);
    const y = Math.floor((targetHeight - newHeight) / 2);
    background.composite(image, x, y);

    // Crea la carpeta 'processed' si no existe
    const outputDir = path.join(__dirname, 'processed');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, `${Date.now()}.jpg`);
    await background.quality(85).writeAsync(outputPath);

    res.json({
      status: 'success',
      url: `https://${req.hostname}/processed/${path.basename(outputPath)}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Processing failed.',
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
