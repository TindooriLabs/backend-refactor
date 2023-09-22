import multer from "multer";

//Callback is empty so it is stored in the main directory
const multerMemoryStorage = multer.memoryStorage({
  destination: function (_req, _file, cb) {
    cb(null, "");
  }
});

const fileFilters = {
  image: file =>
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
};

const fileReqMiddleware = config => {
  return multer({
    storage: multerMemoryStorage,
    limits: { fieldSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      let errorReason, errorMessage;

      //Validate file
      if (!fileFilters[config.fileType](file)) {
        errorReason = "bad-request";
        errorMessage = `Invalid file type: ${file.mimetype}`;
      }

      if (errorReason) {
        req.fileValidationError = {
          reason: errorReason,
          message: errorMessage
        };
        cb(null, false, new Error(`${errorReason}: ${errorMessage}`));
      } else {
        cb(null, true);
      }
    }
  }).single(config.bodyParamKey);

};

export default fileReqMiddleware;
