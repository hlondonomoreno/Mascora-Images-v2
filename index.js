
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { getDominantColor } = require('./utils/colors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 10000;

app.use(cors());

app.post('/process', upload.single('file'), async (req, res) => {
    try {
        const inputPath = req.file.path;
        const outputPath = `processed/${Date.now()}.jpg`;

        const original = sharp(inputPath);
        const metadata = await original.metadata();

        const targetWidth = 1000;
        const targetHeight = 700;

        const left = Math.max(0, Math.floor((targetWidth - metadata.width) / 2));
        const top = Math.max(0, Math.floor((targetHeight - metadata.height) / 2));

        const bgColor = "#fca53d";

        const canvas = createCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(
            targetWidth / 2, targetHeight / 2, 10,
            targetWidth / 2, targetHeight / 2, targetWidth
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, bgColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const buffer = canvas.toBuffer('image/png');
        const base = sharp(buffer).composite([{ input: inputPath, top, left }]);

        await base
            .resize(targetWidth, targetHeight, { fit: 'cover' })
            .jpeg()
            .toFile(outputPath);

        fs.unlinkSync(inputPath); // cleanup

        res.json({ status: "ok", url: `https://mascora-images.onrender.com/${outputPath}` });
    } catch (err) {
  console.error("Error al procesar imagen:", err);
  res.status(500).json({
    status: "error",
    message: "Processing failed.",
    details: err.message // opcional
  });
}
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
