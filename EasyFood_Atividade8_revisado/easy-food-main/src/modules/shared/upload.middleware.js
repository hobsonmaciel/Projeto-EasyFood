const multer = require("multer");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Formato inválido. Envie uma imagem JPEG, PNG ou WebP.");
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  }
});

function receiveImage(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
        error: error.code === "LIMIT_FILE_SIZE"
          ? "A imagem deve ter no máximo 5 MB."
          : "Não foi possível receber o arquivo. Envie apenas uma imagem."
      });
    }
    return res.status(error.statusCode || 400).json({ error: error.message });
  });
}

module.exports = receiveImage;
