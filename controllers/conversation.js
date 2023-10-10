import { validateSchema } from "../util/schemas.js";
import { getFailureBody } from "./controller-helper.js";
import {
  getUserConversations as getUserConversationsDomain,
  getConversation as getConversationDomain,
  sendMessage as sendMessageDomain,
  translateMessages as translateMessagesDomain,
} from "../domain/conversation.js";

export const getUserConversations = async (req) => {
  //Validate params and query
  const paramsValidation = validateSchema(
    req.params,
    "getUserConversationsParams"
  );
  if (!paramsValidation.ok) {
    return getFailureBody(paramsValidation);
  }

  const { userId } = req.params;

  const result = await getUserConversationsDomain(userId);

  //Return success
  if (result.ok) {
    if (!result.conversations?.length) {
      return { status: 204 };
    }
    return { status: 200, body: result.conversations };
  }

  return getFailureBody(result);
};

export const getConversation = async (req) => {
  //Validate params and query
   const paramsValidation = validateSchema(req.params, "getConversationParams");
   if (!paramsValidation.ok) {
     return getFailureBody(paramsValidation);
   }
   const queryValidation = validateSchema(req.query, "getConversationQuery");
   if (!queryValidation.ok) {
     return getFailureBody(queryValidation);
   }
  const { userId: fromUserId } = req.user;

  const { conversationId } = req.params;
  const {page, pageLength} = req.query;

  const result = await getConversationDomain(fromUserId, conversationId, page, pageLength);

  //Return success
  if (result.ok) {
    return { status: 200, body: result.conversation };
  }

  return getFailureBody(result);
};

export const sendMessage = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "sendMessageBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  
  const { userId: fromUserId } = req.user;

  const { toUserIds, conversationId, message, language } = req.body;

  const result = await sendMessageDomain(
    fromUserId,
    toUserIds,
    conversationId,
    message,
    language
  );

  //Return success
  if (result.ok) {
    return { status: 200, body: result.conversation };
  }

  return getFailureBody(result);
};

export const translateMessages = async (req) => {
  //Validate query
  const queryValidation = validateSchema(req.body, "translateMessagesBody");
  if (!queryValidation.ok) {
    return getFailureBody(queryValidation);
  }
  const { messageIds, language } = req.body;
  const { userId } = req.user;

  const result = await translateMessagesDomain(messageIds, language, userId);

  //Return success
  if (result.ok) {
    if (!result.messages?.length) {
      return { status: 204 };
    }
    return { status: 200, body: result.messages };
  }

  return getFailureBody(result);
};
