import { validateSchema } from "../util/schemas.js";
import { getFailureBody } from "./controller-helper.js";
import {
  createUser,
  verifyAccount as verifyAccountDomain,
} from "../domain/auth.js";

export const emailRegister = async req => {
  try{
  //Validate body
  const validation = validateSchema(req.body, "emailRegisterBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }

  const response = await createUser(req.body);

  if (!response.ok) {
    return getFailureBody(response);
  }
}catch(e){
  console.log(e)
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

export const verifyAccount = async req => {
  //Validate body
  const validation = validateSchema(req.body, "verifyAccountBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;
  const { code } = req.body;
 
  const result = await verifyAccountDomain(userId, code);

  //Return success
  if (result.ok) {
    return {
      status: 200,
      body: { verified: result.verified, user: result.user }
    };
  }

  return getFailureBody(result);
};
