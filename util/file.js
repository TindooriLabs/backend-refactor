import sharp from "sharp";
import config from "../config/default.js";

export const compress = (file) => {
  return sharp(file)
    .jpeg({ quality: config.images.compressionQuality })
    .toBuffer();
};
