function createMarketImportFileRuntime({
  fs,
  path,
  crypto,
  pipeline,
  uploadDir,
  maxUploadBytes,
  ensureUploadDir,
  logger = console
}) {
  function resolveMarketImportUploadPath(filePath) {
    const uploadRoot = path.resolve(uploadDir);
    const resolved = path.resolve(String(filePath || ''));

    if (!resolved.startsWith(`${uploadRoot}${path.sep}`)) {
      throw new Error('Upload source must stay inside the market-data upload folder');
    }

    return resolved;
  }

  async function deleteMarketImportSourceFile(filePath) {
    if (!filePath) {
      return;
    }

    try {
      await fs.promises.unlink(resolveMarketImportUploadPath(filePath));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Unable to remove processed market import upload: ${error.message}`);
      }
    }
  }

  function createMarketImportUploadPath(userId, sourceFileName = 'candles.csv') {
    ensureUploadDir();
    const safeExtension = path.extname(sourceFileName).toLowerCase() === '.csv' ? '.csv' : '.csv';
    const fileName = [
      new Date().toISOString().replace(/[:.]/g, '-'),
      `user-${userId}`,
      crypto.randomUUID()
    ].join('-') + safeExtension;

    return path.join(uploadDir, fileName);
  }

  async function saveMarketImportUpload(req, destinationPath) {
    let bytes = 0;

    try {
      await pipeline(
        (async function* limitUpload(source) {
          for await (const chunk of source) {
            bytes += chunk.length;

            if (bytes > maxUploadBytes) {
              throw new Error('CSV upload is too large. Keep a single import under 512 MB for now.');
            }

            yield chunk;
          }
        }(req)),
        fs.createWriteStream(destinationPath, { flags: 'wx' })
      );

      if (!bytes) {
        throw new Error('CSV upload is empty');
      }

      return bytes;
    } catch (error) {
      await fs.promises.rm(destinationPath, { force: true });
      throw error;
    }
  }

  return {
    resolveMarketImportUploadPath,
    deleteMarketImportSourceFile,
    createMarketImportUploadPath,
    saveMarketImportUpload
  };
}

module.exports = {
  createMarketImportFileRuntime
};
