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
  getTranslation,
  getUserName,
  insertCachedTranslation,
  getUsersLanguages,
  updateMessageById,
  getAllTranslations,
} from "../database/queries/conversation.js";
import { languageLevelIds, languageIds } from "../database/constants.js";
import { translator } from "../clients/translate.js";

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
    if (chat.lastMessage) {
      chat.lastMessage["message"] = chat.lastMessage["text"];
      chat.lastMessage["sent"] = chat.lastMessage["sendTime"];
      chat.lastMessage["fromUserId"] = chat.lastMessage["senderId"];
      chat.lastMessage["language"] = Object.keys(languageIds).find(
        (key) => languageIds[key] === chat.lastMessage["originalLanguageName"]
      );
      chat.lastMessage["id"] = chat.lastMessage["id"].toString();
      [
        "chatId",
        "text",
        "sendTime",
        "senderId",
        "originalLanguageName",
      ].forEach((e) => delete chat.lastMessage[e]);
    }
  });

  return { ok: true, conversations: answer };
};

export const getConversation = async (
  fromUserId,
  conversationId,
  page,
  pageLength
) => {
  const conversationResult = await getChatById(
    conversationId,
    page,
    pageLength
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

  conversationResult.participants = conversationResult.participants.map((c) => {
    let selected = participantNamesResult.find((p) => p.userId === c.id);
    return {
      id: selected.userId,
      name: selected.firstName,
    };
  });
  let messageIds = conversationResult.messages.map((m) => m.id);
  let messageTranslations = await getAllTranslations(messageIds);
  conversationResult.messages = conversationResult.messages.map((e) => {
    e.translations = {};
    let translationsForMessage = messageTranslations.filter(
      (translation) => translation.messageId === e.id
    );
    translationsForMessage.map((translation) => {
      let languageIso = Object.keys(languageIds).find(
        (key) => languageIds[key] === translation.toLanguageName
      );
      e.translations[languageIso] = {
        language: languageIso,
        message: translation.targetText,
        expires: translation.expiration,
      };
    });
    e.id = e.id.toString();
    e["message"] = e["text"];
    e["sent"] = e["sendTime"];
    e["fromUserId"] = e["senderId"];
    e["language"] = Object.keys(languageIds).find(
      (key) => languageIds[key] === e["originalLanguageName"]
    );
    ["chatId", "text", "sendTime", "senderId", "originalLanguageName"].forEach(
      (key) => delete e[key]
    );
    return e;
  });

  //Get default target language
  const targetLanguageResult = await getDefaultTargetLanguage(
    conversationResult,
    fromUserId
  );
  if (!targetLanguageResult.ok) return targetLanguageResult;

  conversationResult.targetLanguage = targetLanguageResult.languageId;

  return { ok: true, conversation: conversationResult };
};

export const sendMessage = async (
  fromUserId,
  toUserIds,
  existingConversationId,
  message,
  language
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
    languageIds[language]
  );

  //Emit the notification to participants
  const participantNamesResult = await getParticipantNames(participants);

  conversationResponse.participants = participantNamesResult.map((p) => {
    p.name = p.firstName;
    p.id = p.userId;
    delete p.firstName;
    delete p.userId;
    return p;
  });
  const notification = {
    type: "message",
    recipients: conversationResponse.participants.filter(
      (p) => p.id != fromUserId.toString()
    ),
    body: {
      conversation: { ...conversationResponse },
      message: {
        ...messageResult,
        fromUserName: conversationResponse.participants.find(
          (p) => p.id === fromUserId.toString()
        ).name,
      },
    },
  };

  sendNotification(notification);

  return { ok: true, conversation: conversationResponse };
};

const getCachedTranslationForMessage = async (message, targetLanguage) => {
  const today = new Date();
  const cachedTranslation = await getTranslation(
    message.id,
    message.originalLanguageName,
    languageIds[targetLanguage]
  );

  //Valid cached translation
  if (cachedTranslation && today.isBefore(cachedTranslation.expiration)) {
    return cachedTranslation;
  }

  return null;
};

const translateMessage = async (message, targetLanguage) =>
  translator.translate(
    message.text,
    Object.keys(languageIds).find(
      (key) => languageIds[key] === message.originalLanguageName
    ),
    targetLanguage
  );

const configureTranslationForMessage = async (
  message,
  translationText,
  translationLanguage,
  userId
) => {
  const today = new Date();
  const user = await getUserName(userId);
  return {
    messageId: message.id,
    fromLanguageName: message.originalLanguageName,
    toLanguageName: languageIds[translationLanguage],
    sourceText: message.text,
    targetText: translationText,
    lastUpdated: today,
    translatorName: user.firstName,
    expiration: today.addDays(config.translations.googleTranslateCacheDays),
  };
};

const addTranslationToMessage = async (
  message,
  translationText,
  translationLanguage,
  userId
) => {
  const translation = await configureTranslationForMessage(
    message,
    translationText,
    translationLanguage,
    userId
  );

  const addTranslationResult = await insertCachedTranslation(translation);
  const updateMessageResult = await updateMessageById(message.id, {
    lastTranslationLanguage: languageIds[translationLanguage],
  });
  return {
    ...message,
    translations: {
      ...message.translations,
      [translationLanguage]: {
        language: translationLanguage,
        message: translationText,
        expires: translation.expiration,
      },
    },
  };
};

export const translateMessages = async (messageIds, targetLanguage, userId) => {
  let messageIdsInt = messageIds.map((m) => {
    return parseInt(m);
  });
  //Get the messages from the database
  let messages = await getMessagesByIds(messageIdsInt);
  const existingTranslations = await getAllTranslations(messageIdsInt);
  if (!messages || messages.length === 0) {
    return messages;
  }
  messages = messages.map((m) => {
    m.translations = {};
    let translationsForMessage = existingTranslations.filter(
      (translation) => translation.messageId === m.id
    );
    translationsForMessage.map((translation) => {
      let languageIso = Object.keys(languageIds).find(
        (key) => languageIds[key] === translation.toLanguageName
      );
      m.translations[languageIso] = {
        language: languageIso,
        message: translation.targetText,
        expires: translation.expiration,
      };
    });
    return m;
  });

  const translatedMessages = await Promise.all(
    messages.map(async (m) => {
      //Don't translate to same language
      const today = new Date();

      if (
        (m.translations &&
        m.translations[targetLanguage] &&
        today.isBefore(m.translations[targetLanguage].expires)) ||
        (m.originalLanguageName === languageIds[targetLanguage])
      ) {
        m.id = m.id.toString();
        m["message"] = m["text"];
        m["sent"] = m["sendTime"];
        m["fromUserId"] = m["senderId"];
        m["language"] = Object.keys(languageIds).find(
          (key) => languageIds[key] === m["originalLanguageName"]
        );
        [
          "chatId",
          "text",
          "sendTime",
          "senderId",
          "originalLanguageName",
        ].forEach((key) => delete m[key]);
        return m;
      }

      //Fetch a new translation
      const translationResult = await translateMessage(m, targetLanguage);
      if (!translationResult.ok) {
        throw Error(
          `Error translating message to ${targetLanguage}: ${m.message}`
        );
      }

      //Get the return for a translation and cache the translation
      const newTranslation = await addTranslationToMessage(
        m,
        translationResult.translation,
        targetLanguage,
        userId
      );
      newTranslation.id = newTranslation.id.toString();
      newTranslation["message"] = newTranslation["text"];
      newTranslation["sent"] = newTranslation["sendTime"];
      newTranslation["fromUserId"] = newTranslation["senderId"];
      newTranslation["language"] = Object.keys(languageIds).find(
        (key) => languageIds[key] === newTranslation["originalLanguageName"]
      );
      [
        "chatId",
        "text",
        "sendTime",
        "senderId",
        "originalLanguageName",
      ].forEach((key) => delete newTranslation[key]);

      return newTranslation;
    })
  );

  return { ok: true, messages: translatedMessages };
};

export const getDefaultTargetLanguage = async (conversation, fromUserId) => {
  const participants = conversation.participants.map((p) => p.id);
  //Get participant languages
  const participantLanguages = await getUsersLanguages(participants);

  if (!participantLanguages) {
    return {
      ok: false,
      reason: "server-error",
      message: "Failed to get conversation participant languages.",
    };
  }

  //Find a shared language

  //Languages that the from user (the active user viewing the conversation) is interested in learning
  const interestedLanguages = participantLanguages.reduce((agg, uL) => {
    if (uL.userId === fromUserId) {
      if (uL.isLearning === true) {
        agg[uL.languageName] = true;
      }
    }
    return agg;
  }, {});

  //Match interestedLanguages with fluentLanguages and take the fluentLanguages with the highest number
  const targetLanguages = participantLanguages
    .filter(
      (uL) => uL.userId !== fromUserId && interestedLanguages[uL.languageName]
    )
    .sort((a, b) => {
      if (a.languageLevel === b.languageLevel) {
        // if languageLevel is the same, sort by languageId
        let a_langId = Object.keys(languageIds).find(
          (key) => languageIds[key] === a.languageName
        );
        let b_langId = Object.keys(languageIds).find(
          (key) => languageIds[key] === b.languageName
        );
        if (a_langId < b_langId) return -1;
        if (a_langId > b_langId) return 1;
        return 0;
      }
      // sort by languageLevel
      return (
        languageLevelIds[b.languageLevel] - languageLevelIds[a.languageLevel]
      );
    });

  let targetLanguage;
  if (!targetLanguages?.length) {
    console.log(
      `Unable to find common conversation target language for the two users: ${JSON.stringify(
        participants
      )} where ${fromUserId} is the active user.`
    );
    targetLanguage = null;
  } else {
    targetLanguage = Object.keys(languageIds).find((key) => {
      return languageIds[key] === targetLanguages[0].languageName;
    });
  }

  return { ok: true, languageId: targetLanguage };
};
