export function comprimirImagen(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxWidth) {
        width = Math.round((width * maxWidth) / height);
        height = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compresión falló"));
          resolve(blob);
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Error al cargar imagen"));
    img.src = URL.createObjectURL(file);
  });
}
