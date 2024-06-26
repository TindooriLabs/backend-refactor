import { Strategy as LocalStrategy } from "passport-local";
import { authenticateUser } from "../domain/auth.js";
import {
  getDeviceByUserId,
  getUserByEmail,
} from "../database/queries/auth.js";
const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (req, email, password, done) {
    const authResult = await authenticateUser(
      email,
      password,
      req.tindooriProps.allowUnverifiedLogin
    );

    if (!authResult.ok || !authResult.user) {
      return done(null, false, authResult);
    }

    //Add device ID
    const device = req.body.appleDeviceId
      ? { kind: "IOS", id: req.body.appleDeviceId }
      : undefined;

    if (device) {
      // const currentUser = await getUserByEmail(email);
      // const storedDevice = await getDeviceByUserId(currentUser.userId, device.id);
      // if (!storedDevice) {
      //   return done(null, false, {
      //     ok: false,
      //     reason: "forbidden",
      //     message: "Invalid device! Please login from your device.",
      //   });
      // }
    }else{
      return done(null, false, {
        ok: false,
        reason: "bad-request",
        message: "appleDeviceId is required",
      });
    }

    done(null, authResult.user, { ok: true, userId: authResult.userId });
  }
);

export default localStrategy;
