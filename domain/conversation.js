import {
  getUserChatsWithLastMessage,
  getUserNames,
} from "../database/queries/users.js";
import config from "../config/default.js";
import {
  getChatById,
  getParticipantNames,
  upsertChat,
  insertMessage,
  getMessagesByIds,
  
} from "../database/queries/conversation.js";

import { getCachedTranslationForMessage } from "./translate.js";

import { sendNotification } from "./notify.js";

const getChatsWithUserNames = (arr) => {
  const promises = arr.map(async (chat) => {
    let chatResult = {};
    const participantIds = chat.participants.map((p) => {
      return p.id;
    });

    const participantNames = await getUserNames(participantIds);
    chatResult.participants = participantNames.map((p) => {
      return { id: p.userId, name: p.firstName };
    });
    chatResult.id = chat.id;
    if (chat.messages.length > 0) {
      chatResult.lastMessage = chat.messages[0];
    }
    return chatResult;
  });
  return Promise.all(promises);
};

export const getUserConversations = async (userId) => {
  const result = await getUserChatsWithLastMessage(userId);
  const answer = await getChatsWithUserNames(result);
  answer.forEach((chat) => {
    chat.lastMessage["message"] = chat.lastMessage["text"];
    chat.lastMessage["sent"] = chat.lastMessage["sendTime"];
    chat.lastMessage["fromUserId"] = chat.lastMessage["senderId"];
    chat.lastMessage["language"] = chat.lastMessage["originalLanguageName"];
    ["chatId", "text", "sendTime", "senderId", "originalLanguageName"].forEach(
      (e) => delete chat.lastMessage[e]
    );
  });

  return { ok: true, conversations: answer };
};

export const getConversation = async (
  fromUserId,
  conversationId,
  pageLength = config.conversation.pageLength,
  page = 1
) => {
  const conversationResult = await getChatById(
    conversationId,
    pageLength,
    page
  );
  if (conversationResult === null) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the conversation in the SQL database.",
    };
  }

  if (
    typeof conversationResult.participants?.find((p) => p.id == fromUserId) ===
    "undefined"
  ) {
    return {
      ok: false,
      reason: "forbidden",
      message: "User is not a participant in the conversation.",
    };
  }

  const participantNamesResult = await getParticipantNames(
    conversationResult.participants.map((p) => p.id)
  );
  conversationResult.participants = participantNamesResult;

  // //Get default target language
  // const targetLanguageResult = await getDefaultTargetLanguage(
  //   conversation,
  //   fromUserId
  // );
  // if (!targetLanguageResult.ok) return targetLanguageResult;

  // conversation.targetLanguage = targetLanguageResult.languageId;

  return { ok: true, conversation: conversationResult };
};

export const sendMessage = async (
  fromUserId,
  toUserIds,
  existingConversationId,
  message,
  language,
  pageLength
) => {
  const participants = toUserIds
    ? [fromUserId.toString(), ...toUserIds]
    : undefined;

  //Get or create the conversation
  let conversationResponse = await upsertChat(
    existingConversationId,
    participants
  );
  if (!conversationResponse.ok) {
    return conversationResponse;
  }
  conversationResponse = conversationResponse.result;

  const conversationId = existingConversationId || conversationResponse.id;

  //Send the message
  const messageResult = await insertMessage(
    message,
    fromUserId,
    conversationId,
    language
  );

  //Emit the notification to participants
  const participantNamesResult = await getParticipantNames(participants);

  conversationResponse.participants = participantNamesResult;
  const notification = {
    type: "message",
    recipients: conversationResponse.participants.filter(
      (p) => p.userId != fromUserId.toString()
    ),
    body: {
      conversation: { ...conversationResponse },
      message: {
        ...messageResult.message,
        fromUserName: conversationResponse.participants.find(
          (p) => p.userId === fromUserId.toString()
        ).firstName,
      },
    },
  };

  // sendNotification(notification);

  return { ok: true, conversation: conversationResponse };
};

export const translateMessages = async (messageIds, targetLanguage) => {
  //Get the data from mongo
  const messages = await getMessagesByIds(messageIds);
  if (!messages || messages.length === 0) {
    return messages;
  }

  const translatedMessages = await Promise.all(
    messages.map(async (m) => {
      //Don't translate to same language
      if (m.originalLanguageName === targetLanguage) return m;

      //Check message for cached translation
      const cachedTranslation = getCachedTranslationForMessage(
        m,
        targetLanguage
      );

      //Return valid cached translation
      if (cachedTranslation) {
        return joinTranslationToMessage(m, cachedTranslation);
      }

      //Fetch a new translation
      const translationResult = await translateMessage(m, targetLanguage);
      if (!translationResult.ok) {
        throw Error(
          `Error translating message to ${targetLanguage}: ${m.message}`
        );
      }

      //Get the return for a translation and cache the translation
      const newTranslation = addTranslationToMessage(
        m,
        translationResult.translation,
        targetLanguage
      );

      return newTranslation;
    })
  );

  return { ok: true, messages: translatedMessages };
};
