const Jimp = require('jimp');

/**
 * Combina los bordes desenfocados de una imagen con un fondo degradado suave.
 */
async function generateGradientCanvas(image, width, height) {
  // Crear un lienzo base con fondo #d7810e80 sobre #ff9e00ff
  const baseColor = Jimp.cssColorToHex('#f09534'); // Mezcla visual resultante
  const background = new Jimp(width, height, baseColor);

  // Clona la imagen para desenfoque y la centra
  const blurLayer = image.clone();
  blurLayer.resize(width, height).blur(35); // desenfoque más fuerte para mayor fusión

  // Superponer la imagen desenfocada sobre el fondo base
  background.composite(blurLayer, 0, 0, {
    mode: Jimp.BLEND_OVERLAY,
    opacitySource: 1,
    opacityDest: 1
  });

  return background;
}

module.exports = { generateGradientCanvas };
