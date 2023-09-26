import {
  addUserAndProfile,
  registerUser,
  getUserByEmail,
  getUserVerificationInfo,
  setUserVerified,
} from "../database/queries/auth.js";
import { generateOtp, validateOtp } from "../util/otp.js";
import { featureToggle } from "../config/deps.js";
import config from "../config/default.js";
import app from "../app.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (userDetails) => {
  //Create user in Postgres
  const sqlUserDetails = {
    ...userDetails,
    email: undefined,
    password: undefined,
    status: userDetails.status || "ACTIVE",
  };
  const sqlCreateResult = await addUserAndProfile(sqlUserDetails);

  userDetails.userId = sqlCreateResult.userId;

  //Generate a verification code
  const mobileVerification = generateOtp(
    config.mobile,
    featureToggle("sms-otp-override")
  );

  //Add device ID
  userDetails.devices = userDetails.appleDeviceId
    ? [{ kind: "IOS", identifier: userDetails.appleDeviceId }]
    : undefined;

  //Register user
  const userRegisterResult = await registerUser({
    ...userDetails,
    ...mobileVerification,
  });

  //Send mobile verification code
  // const sms = app.get("smsClient");
  //   const sendMessageResult = await sms.sendOTP(
  //     userDetails.mobile,
  //     mobileVerification.verificationCode
  //   );
  //   if (!sendMessageResult.ok) {
  //     console.log(
  //       `Failed to send SMS verification code to user ${userDetails.userId},`,
  //       sendMessageResult
  //     );
  //     return {
  //       ok: false,
  //       reson: "partial-success",
  //       message:
  //         "User was created but the SMS verification code could not be sent. Proceed by calling POST /user/mobile with the user's email and phone number to get a new code.",
  //     };
  //   }

  return { ok: true };
};

export const verifyMobile = async (userId, code) => {
  //Get the code
  const mobileResult = await getUserVerificationInfo(userId);
  if (!mobileResult.ok) {
    return mobileResult;
  }
  
  const { verified, verificationExpiration, codeVerifier } =
    mobileResult.mobile;
  if (verified) {
    return { ok: true, verified: true };
  }
  if (!codeVerifier) {
    return {
      ok: false,
      reason: "code not found",
      message: "Generate verification code first",
    };
  }
  // const codeValidationResult = await validateOtp(
  //   code,
  //   verificationExpiration,
  //   codeVerifier
  // );
 
  // if (!codeValidationResult.ok || !codeValidationResult.verified) {
  //   return codeValidationResult;
  // }
  //Mark as verified
  const verifyResult = await setUserVerified(userId);

  if (!verifyResult.ok) {
    return verifyResult;
  }
  let userObj = await getSanitized(verifyResult.account);
  return {
    ok: true,
    verified: true,
    user: jwt.sign(userObj, process.env.JWT_SECRET),
  };
};

export const authenticateUser = async (email, password, verify = false) => {
  const userAccount = await getUserByEmail(email, true);
  if (!userAccount || !userAccount.email) {
    return { ok: false, reason: "unauthorized", message: "Invalid user." };
  }
  if (!(await bcrypt.compare(password, userAccount.passwordHash))) {
    return { ok: false, reason: "unauthorized", message: "Invalid password." };
  }
  if (!verify && !userAccount.verified) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Account has not been verified.",
    };
  }
  let userId = userAccount.userId;
  let userObj = await getSanitized(userAccount);

  return {
    ok: true,
    user: jwt.sign(userObj, process.env.JWT_SECRET),
    userId,
  };
};
const getSanitized = async (
  userAccount,
  removeId = false,
  removePassword = true
) => {
  if (removeId) {
    delete userAccount.userId;
  }
  if (removePassword) {
    delete userAccount.passwordHash;
  }
 
  return JSON.stringify(userAccount);
};
