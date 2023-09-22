import jwt from "jsonwebtoken";

export function socketLog(socket, next) {
  console.log("Socket event @", socket.handshake.url);
  next();
}

//Note: this is manual since I had trouble getting passport to integrate https://socket.io/docs/v4/middlewares/#compatibility-with-express-middleware
export function socketJwtAuth(socket, next) {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user.userId) {
      next(Error("Unauthorized"));
    }
    socket.user = user;
  } catch (err) {
    next(err);
  }

  next();
}
