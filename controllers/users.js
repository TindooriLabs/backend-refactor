
import { getFailureBody } from "./controller-helper.js";
import { getUser as getUserDomain } from "../domain/users.js"
import { validateSchema } from "../util/schemas.js";
export const getOwnUser = async req => {
    // const { userId } = req.user;
    const userId = 1;

    const result = await getUserDomain(parseInt(userId), 2);
  
    //Return success
    if (result.ok) {
      return { status: 200, body: result.user };
    }
  
    return getFailureBody(result);
  };

  export const getUser = async req => {
    //Validate body
    // const validation = validateSchema(req.params, "getUserParams");
    // if (!validation.ok) {
    //   return getFailureBody(validation);
    // }
    // const { userId: requestingUserId } = req.user;
    const requestingUserId = 1; 
    const { userId } = req.params;
  
    const result = await getUserDomain(parseInt(userId), requestingUserId);
  
    //Return success
    if (result.ok) {
      return { status: 200, body: result.user };
    }
  
    return getFailureBody(result);
  };