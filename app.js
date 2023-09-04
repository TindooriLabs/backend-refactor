import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import userRouter from "./routes/users.js";

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())

app.use('/users', userRouter);

export default app;
