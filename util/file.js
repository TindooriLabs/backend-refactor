import sharp from "sharp";
import config from "../config/default.js";

export const compress = (file) => {
  return sharp(file)
    .resize(200, 200)
    .jpeg({ quality: config.images.compressionQuality })
    .toBuffer();
};

export const decompress = (buffer) => {
  return sharp(buffer).toBuffer();
};
