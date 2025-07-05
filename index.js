const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { generateGradientCanvas } = require('./utils/colors');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

/**
 * Extrae el color dominante promedio de una imagen.
 * Devuelve un string hex: "#rrggbb"
 */
async function getDominantColor(image) {
  // Reducimos a 1x1 para obtener el promedio
  const pixel = image.clone().resize(1, 1).bitmap.data;
  const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

/**
 * Mezcla dos colores hex (#rrggbb) al 50% cada uno.
 * Devuelve un string hex: "#rrggbb"
 */
function mixColors(hex1, hex2) {
  // Quitar el '#'
  const c1 = hex1.replace(/^#/, '');
  const c2 = hex2.replace(/^#/, '');
  const r1 = parseInt(c1.substr(0, 2), 16),
    g1 = parseInt(c1.substr(2, 2), 16),
    b1 = parseInt(c1.substr(4, 2), 16);
  const r2 = parseInt(c2.substr(0, 2), 16),
    g2 = parseInt(c2.substr(2, 2), 16),
    b2 = parseInt(c2.substr(4, 2), 16);
  const r = Math.round((r1 + r2) / 2),
    g = Math.round((g1 + g2) / 2),
    b = Math.round((b1 + b2) / 2);
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    // Leer imagen
    const img = await Jimp.read(req.file.path);

    // Obtener dos colores dominantes
    const color1 = await getDominantColor(img);
    const color2 = await getDominantColor(img.clone().rotate(180));
    // Mezclarlos
    const finalColor = mixColors(color1, color2);

    // Preparar fondo desenfocado + overlay finalColor
    const width = 1000,
      height = 700;
    const background = await generateGradientCanvas(img, width, height, finalColor);

    // Redimensionar y centrar la imagen original
    img.scaleToFit(width * 0.8, height * 0.8);
    const x = Math.round((width - img.bitmap.width) / 2);
    const y = Math.round((height - img.bitmap.height) / 2);
    background.composite(img, x, y);

    // Asegurar carpeta processed/
    const processedDir = path.join(__dirname, 'processed');
    if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);

    // Guardar resultado
    const outName = `processed/${Date.now()}.jpg`;
    await background.quality(85).writeAsync(outName);

    // Borrar original
    fs.unlinkSync(req.file.path);

    // Devolver URL
    const url = `${req.protocol}://${req.get('host')}/${outName}`;
    res.json({ status: 'success', url });
  } catch (err) {
    console.error('Error processing image:', err);
    res
      .status(500)
      .json({ status: 'error', message: 'Processing failed.', details: err.message });
  }
});

// Servir estáticos
app.use('/processed', express.static(path.join(__dirname, 'processed')));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
