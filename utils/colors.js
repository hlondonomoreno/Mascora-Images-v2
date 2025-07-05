const Jimp = require('jimp');

/**
 * Genera un fondo desenfocado a partir de la imagen original
 * y superpone un overlay del color target (hex).
 */
async function generateGradientCanvas(image, width, height, targetHex) {
  // Creamos fondo desenfocado
  const background = image.clone().resize(width, height).blur(35);

  // Creamos un overlay sólido del color final
  const overlay = new Jimp(width, height, Jimp.cssColorToHex(targetHex + 'ff')); // 'ff' opacidad total

  // Mezclamos con opacidad 0.3 para un efecto suave
  background.composite(overlay, 0, 0, {
    mode: Jimp.BLEND_OVERLAY,
    opacitySource: 0.3,
    opacityDest: 1
  });

  return background;
}

module.exports = { generateGradientCanvas };
