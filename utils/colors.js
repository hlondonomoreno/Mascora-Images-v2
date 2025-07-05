const Jimp = require('jimp');

/**
 * Extrae el color dominante de una imagen Jimp
 * @param {Jimp} image
 * @returns {Promise<string>} color en formato hexadecimal (#RRGGBB)
 */
async function getDominantColor(image) {
  const resized = image.clone().resize(1, 1);
  const { r, g, b } = resized.bitmap.data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Mezcla dos colores hexadecimales (formato #rrggbb) con pesos dados.
 */
function mixColors(color1, color2, weight = 0.5) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r = Math.round(((c1 >> 16) * weight + (c2 >> 16) * (1 - weight)));
  const g = Math.round((((c1 >> 8) & 0xff) * weight + ((c2 >> 8) & 0xff) * (1 - weight)));
  const b = Math.round(((c1 & 0xff) * weight + (c2 & 0xff) * (1 - weight)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Genera un fondo con degradado suave y superpone una imagen desenfocada.
 */
async function generateGradientCanvas(image, width, height) {
  const baseColor = Jimp.cssColorToHex('#f09534');
  const background = new Jimp(width, height, baseColor);

  const blurLayer = image.clone().resize(width, height).blur(35);

  background.composite(blurLayer, 0, 0, {
    mode: Jimp.BLEND_OVERLAY,
    opacitySource: 1,
    opacityDest: 1
  });

  return background;
}

module.exports = {
  getDominantColor,
  mixColors,
  generateGradientCanvas
};
