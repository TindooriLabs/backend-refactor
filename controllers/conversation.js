import { validateSchema } from "../util/schemas.js";
import { getFailureBody } from "./controller-helper.js";
import {
    getUserConversations as getUserConversationsDomain,
  } from "../domain/conversation.js";
  
export const getUserConversations = async req => {
    //Validate params and query
    const paramsValidation = validateSchema(
      req.params,
      "getUserConversationsParams"
    );
    if (!paramsValidation.ok) {
      return getFailureBody(paramsValidation);
    }
  
    const { userId } = req.params;
  
    const result = await getUserConversationsDomain(parseInt(userId));
  
    //Return success
    if (result.ok) {
      if (!result.conversations?.length) {
        return { status: 204 };
      }
      return { status: 200, body: result.conversations };
    }
  
    return getFailureBody(result);
  };