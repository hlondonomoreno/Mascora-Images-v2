const Jimp = require('jimp');

/**
 * Extrae el color dominante de una imagen.
 * Retorna el color como string hexadecimal (#rrggbb)
 */
async function getDominantColor(image) {
  let r = 0, g = 0, b = 0;
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const total = width * height;

  for (let x = 0; x < width; x += 10) {
    for (let y = 0; y < height; y += 10) {
      const idx = image.getPixelColor(x, y);
      const { r: red, g: green, b: blue } = Jimp.intToRGBA(idx);
      r += red;
      g += green;
      b += blue;
    }
  }

  // Promediar y limitar a 255
  r = Math.min(255, Math.round(r / (total / 100)));
  g = Math.min(255, Math.round(g / (total / 100)));
  b = Math.min(255, Math.round(b / (total / 100)));

  // Formato hexadecimal
  const hex = Jimp.rgbaToInt(r, g, b, 255);
  return '#' + ((hex >> 8) & 0xFFFFFF).toString(16).padStart(6, '0');
}

/**
 * Genera un fondo degradado usando el color dominante.
 */
async function generateGradientCanvas(image, width, height) {
  const hex = await getDominantColor(image);
  const baseColor = Jimp.cssColorToHex(hex);
  const background = new Jimp(width, height, baseColor);

  const blurLayer = image.clone().resize(width, height).blur(35);
  background.composite(blurLayer, 0, 0, {
    mode: Jimp.BLEND_OVERLAY,
    opacitySource: 1,
    opacityDest: 1,
  });

  return background;
}

module.exports = { getDominantColor, generateGradientCanvas };
