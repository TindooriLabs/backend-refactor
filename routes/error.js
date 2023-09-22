import { handleError } from "../controllers/error.js";

//Error Middleware (must be defined with 4 arguments)
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (error, req, res, _next) => {
  console.log("Error at Path: ", req.path);
  console.error("Error: ", error);

  const { status, body } = handleError(error);

  res.status(status).send(body);
};

export function errorWrapper(fn) {
  return async function (req, res, next) {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}
