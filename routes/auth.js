import { Router } from "express";
import passport from "passport";
import {
  emailLogin,
  emailRegister,
  verifyAccount,
} from "../controllers/auth.js";
import { errorWrapper } from "./error.js";

const router = Router();

router.post(
  "/email",
  errorWrapper(async function (req, res) {
    //Create the user
    const { status, body } = await emailRegister(req);
    res.status(status).send(body);
  })
);

router.post(
  "/email/login",
  errorWrapper(function (req, res, next) {
    passport.authenticate(
      "local",
      {
        session: false,
      },
      function (err, user, response) {
        const { status, body } = emailLogin(err, user, response);
        res.status(status).send(body);
      }
    )(req, res, next);
  })
);

//Verify mobile number
// router.post(
//   "/mobile/verify",
//   //Login with email and password
//   errorWrapper(function (req, res, next) {
//     //Allow unverified login for this endpoint
//     req.tindooriProps.allowUnverifiedLogin = true;
//     passport.authenticate(
//       "local",
//       {
//         session: false,
//       },
//       function (err, user, response) {
//         const { status, body } = emailLogin(err, user, response);
//         //Return unsuccessful login
//         if (!(status >= 200 && status < 300)) {
//           res.status(status).send(body);
//         } else {
//           //Clean body, add token, and send to next middleware
//           delete req.body.email;
//           delete req.body.password;
//           req.headers.authorization = "Bearer " + body.user;
//           next();
//         }
//       }
//     )(req, res, next);
//   }),
//   //Validate token and add user to req
//   errorWrapper(function (req, res, next) {
//     passport.authenticate("jwt", { session: false })(req, res, next);
//   }),
//   //Update the user verification status
//   errorWrapper(async (req, res) => {
//     const { status, body } = await verifyAccount(req);
//     res.status(status).send(body);
//   })
// );

router.post(
  "/email/verify",
  //Login with email and password
  errorWrapper(function (req, res, next) {
    //Allow unverified login for this endpoint
    req.tindooriProps.allowUnverifiedLogin = true;
    passport.authenticate(
      "local",
      {
        session: false,
      },
      function (err, user, response) {
        const { status, body } = emailLogin(err, user, response);
        //Return unsuccessful login
        if (!(status >= 200 && status < 300)) {
          res.status(status).send(body);
        } else {
          //Clean body, add token, and send to next middleware
          delete req.body.email;
          delete req.body.password;
          req.headers.authorization = "Bearer " + body.user;
          next();
        }
      }
    )(req, res, next);
  }),
  //Validate token and add user to req
  errorWrapper(function (req, res, next) {
    passport.authenticate("jwt", { session: false })(req, res, next);
  }),
  //Update the user verification status
  errorWrapper(async (req, res) => {
    const { status, body } = await verifyAccount(req);
    res.status(status).send(body);
  })
);

export default router;
