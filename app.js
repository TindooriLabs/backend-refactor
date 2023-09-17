import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import userRouter from "./routes/users.js";
import userPreferencesRouter from "./routes/preferences.js";
import userProfileRouter from "./routes/profile.js";
import relationshipRouter from "./routes/relationship.js";

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/user", userRouter);
app.use("/user/preferences", userPreferencesRouter);
app.use("/user/profile", userProfileRouter);
app.use("/user/relationship", relationshipRouter);

export default app;
