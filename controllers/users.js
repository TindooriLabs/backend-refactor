
import { getFailureBody } from "./controller-helper.js";
import { getUser as getUserDomain } from "../domain/users.js"
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