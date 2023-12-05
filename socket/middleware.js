import jwt from "jsonwebtoken";

export function socketLog(socket, next) {
  console.log("Socket event @", socket.handshake.url);
  next();
}

//Note: this is manual since I had trouble getting passport to integrate https://socket.io/docs/v4/middlewares/#compatibility-with-express-middleware
// export function socketJwtAuth(socket, next) {
//   const token = socket.handshake.headers.authorization;
//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
//     if (!user.userId) {
//       next(Error("Unauthorized"));
//     }
//     socket.user = user;
//   } catch (err) {
//     next(err);
//   }

//   next();
// }

export function socketJwtAuth(token) {
  let user = {userId: ""}
  try {
     user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
			return {
        ok: false,
        reason: "unauthorized",
        message: "Invalid User!"
      }
		}
    return {
      ok: false,
      reason: "bad-request",
      message: err.message,
    };
  }
  return { ok: true, userId: user.userId};
}
