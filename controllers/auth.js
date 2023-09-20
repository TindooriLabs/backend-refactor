import { validateSchema } from "../util/schemas.js";
import { getFailureBody } from "./controller-helper.js";
import {
  createUser,
  verifyMobile as verifyMobileDomain
} from "../domain/auth.js";

export const emailRegister = async req => {
  //Validate body
//   const validation = validateSchema(req.body, "emailRegisterBody");
//   if (!validation.ok) {
//     return getFailureBody(validation);
//   }

  const response = await createUser(req.body);

  if (!response.ok) {
    return getFailureBody(response);
  }

  return { status: 204 };
};

export const emailLogin = (error, user, authResponse) => {
  if (error) {
    return { status: 500, body: error };
  }
  if (!authResponse.ok) {
    return getFailureBody(authResponse);
  }

  return { status: 200, body: { user } };
};

export const verifyMobile = async req => {
  //Validate body
  // const validation = validateSchema(req.body, "verifyMobileBody");
  // if (!validation.ok) {
  //   return getFailureBody(validation);
  // }
  const { userId, mobile } = req.user;
  const { code } = req.body;
 
  const result = await verifyMobileDomain(userId, code, mobile);

  //Return success
  if (result.ok) {
    return {
      status: 200,
      body: { verified: result.verified, user: result.user }
    };
  }

  return getFailureBody(result);
};
