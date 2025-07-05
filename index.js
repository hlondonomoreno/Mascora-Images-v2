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
 */
async function getDominantColor(image) {
  const { r, g, b } = image.clone().resize(1, 1).bitmap.data;
  return Jimp.rgbaToInt(r, g, b, 255);
}

/**
 * Combina dos colores en formato hexadecimal string.
 */
function mixColors(hex1, hex2) {
  const c1 = Jimp.intToRGBA(Jimp.cssColorToHex(hex1));
  const c2 = Jimp.intToRGBA(Jimp.cssColorToHex(hex2));
  const r = Math.round((c1.r + c2.r) / 2);
  const g = Math.round((c1.g + c2.g) / 2);
  const b = Math.round((c1.b + c2.b) / 2);
  return Jimp.rgbaToInt(r, g, b, 255);
}

// Ruta principal de procesamiento
app.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const imagePath = req.file.path;
    const image = await Jimp.read(imagePath);

    // Extraer colores dominantes
    const color1 = await getDominantColor(image);
    const color2 = await getDominantColor(image.clone().rotate(180));

    // Convertir a strings hexadecimales válidos
    const hex1 = '#' + color1.toString(16).padStart(8, '0').slice(0, 6);
    const hex2 = '#' + color2.toString(16).padStart(8, '0').slice(0, 6);

    // Combinar colores
    const finalColor = mixColors(hex1, hex2);

    // Crear fondo degradado + imagen centrada
    const width = 1000;
    const height = 700;
    const background = await generateGradientCanvas(image, width, height);

    // Redimensionar imagen original manteniendo proporciones
    image.scaleToFit(width * 0.8, height * 0.8);

    // Centrar imagen en el fondo
    const x = (width - image.bitmap.width) / 2;
    const y = (height - image.bitmap.height) / 2;
    background.composite(image, x, y);

    // Guardar imagen procesada
    const filename = `processed/${Date.now()}.jpg`;
    await background.quality(85).writeAsync(filename);

    // Limpiar archivo original
    fs.unlinkSync(imagePath);

    // Devolver URL
    const fileUrl = `${req.protocol}://${req.get('host')}/${filename}`;
    res.json({ status: 'success', url: fileUrl });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ status: 'error', message: 'Processing failed.', details: error.message });
  }
});

// Servir archivos estáticos de la carpeta "processed"
app.use('/processed', express.static(path.join(__dirname, 'processed')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
