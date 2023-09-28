import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import logger from "morgan";
import userRouter from "./routes/users.js";
import userPreferencesRouter from "./routes/preferences.js";
import userProfileRouter from "./routes/profile.js";
import relationshipRouter from "./routes/relationship.js";
import conversationRouter from "./routes/conversation.js";
import authRouter from "./routes/auth.js";
import { clearTindooriProps } from "./middleware/tindoori-props.js";
import localStrategy from "./passport/local.js";
import jwtStrategy from "./passport/jwt.js";
import passport from "passport";

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//Clear Tindoori props from req
app.use(clearTindooriProps);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(passport.initialize());
passport.use("local", localStrategy);
passport.use("jwt", jwtStrategy);

//Routes
app.use("/auth", authRouter);
//All routes below here require auth
app.use("/user", passport.authenticate("jwt", { session: false }), userRouter);
app.use(
  "/user/preferences",
  passport.authenticate("jwt", { session: false }),
  userPreferencesRouter
);
app.use(
  "/user/profile",
  passport.authenticate("jwt", { session: false }),
  userProfileRouter
);
app.use(
  "/user/relationship",
  passport.authenticate("jwt", { session: false }),
  relationshipRouter
);
app.use(
  "/conversation",
  passport.authenticate("jwt", { session: false }),
  conversationRouter
);

app.get("/", (req, res) => {
  res.send("Hello world!");
})

export default app;
