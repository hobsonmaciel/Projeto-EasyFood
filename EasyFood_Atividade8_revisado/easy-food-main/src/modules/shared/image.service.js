const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const uploadsRoot = path.join(__dirname, "../../../public/uploads");
const allowedFormats = new Set(["jpeg", "png", "webp"]);

async function processAndStoreImage(file, folder, identifier) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    const error = new Error("Envie uma imagem no campo 'image'.");
    error.statusCode = 400;
    throw error;
  }

  let metadata;
  try {
    metadata = await sharp(file.buffer, { failOn: "error" }).metadata();
  } catch {
    const error = new Error("O arquivo enviado não é uma imagem válida.");
    error.statusCode = 400;
    throw error;
  }

  if (!allowedFormats.has(metadata.format)) {
    const error = new Error("Formato inválido. Use JPEG, PNG ou WebP.");
    error.statusCode = 400;
    throw error;
  }

  const directory = path.join(uploadsRoot, folder);
  await fs.mkdir(directory, { recursive: true });
  const filename = `${identifier}-${crypto.randomUUID()}.webp`;
  const destination = path.join(directory, filename);

  try {
    await sharp(file.buffer)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(destination);
  } catch (error) {
    await fs.rm(destination, { force: true }).catch(() => {});
    throw error;
  }

  return `/uploads/${folder}/${filename}`;
}

async function removeStoredImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const absolutePath = path.resolve(uploadsRoot, imageUrl.slice("/uploads/".length));
  if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) return;
  await fs.rm(absolutePath, { force: true }).catch(() => {});
}

module.exports = { processAndStoreImage, removeStoredImage };
