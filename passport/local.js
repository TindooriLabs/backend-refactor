import { Strategy as LocalStrategy } from "passport-local";
import { authenticateUser } from "../domain/auth.js";
import { addDevice } from "../database/queries/auth.js";
const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true,
  },
  async function (req, email, password, done) {
    const authResult = await authenticateUser(email, password, {
      allowUnverified: req.tindooriProps.allowUnverifiedLogin,
    });

    if (!authResult.ok || !authResult.user) {
      return done(null, false, authResult);
    }

    //Add device ID
    const device = req.body.appleDeviceId
      ? { kind: "IOS", id: req.body.appleDeviceId }
      : undefined;

    if (device) {
      const addDeviceResult = await addDevice(authResult.userId, device);
      if (!addDeviceResult.ok) {
        console.log(
          `Error adding ${device.kind} device on login for user ${authResult.userId}.`
        );
      }
    }

    done(null, authResult.user, { ok: true });
  }
);

export default localStrategy;
