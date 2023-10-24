import { Strategy as LocalStrategy } from "passport-local";
import { authenticateUser } from "../domain/auth.js";
import {
  getDevice,
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
      const currentUser = await getUserByEmail(email);
      const storedDevice = await getDevice(currentUser.userId, device.id);
      if (!storedDevice) {
        return done(null, false, {
          ok: false,
          reason: "forbidden",
          message: "Invalid device! Please login from your device.",
        });
      }
    }

    done(null, authResult.user, { ok: true });
  }
);

export default localStrategy;
