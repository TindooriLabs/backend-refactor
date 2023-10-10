import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getChatById = async (chatId, page, pageLength) => {
  const pageLengthInt = parseInt(pageLength);
  const pageInt = parseInt(page);
  const result = await prisma.chat.findFirst({
    where: { id: chatId.toString() },
    include: {
      participants: true,
      messages: {
        orderBy: {
          sendTime: "desc",
        },
        take: pageLength,
        skip: pageLength * (page - 1)
      },
    },
  });

  return result;
};

export const getParticipantNames = async (participants) => {
  const result = await prisma.profile.findMany({
    where: {
      userId: {
        in: participants,
      },
    },
    select: {
      userId: true,
      firstName: true,
    },
  });
  return result;
};

export const upsertChat = async (existingConversationId, participantIds) => {
  let result;
  try {
    const participants = participantIds.map((p) => {
      return {
        id: p,
      };
    });
    result = await prisma.chat.upsert({
      where: { id: existingConversationId.toString() },
      update: {
        participants: {
          connect: participants,
        },
      },
      create: {
        id: existingConversationId.toString(),
        participants: {
          connect: participants,
        },
      },
      include: {
        participants: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the user in the SQL database.",
        };
      }
    }
  }
  return { ok: true, result };
};

export const insertMessage = async (
  message,
  fromUserId,
  conversationId,
  originalLanguageName = "English"
) => {
  const lastMessageResponse = await getChatById(conversationId, 1, 1);
  let lastMessage = null;
  if (
    lastMessageResponse &&
    lastMessageResponse.messages &&
    lastMessageResponse.messages.length > 0
  ) {
    lastMessage = lastMessageResponse?.messages[0];
  }
  const createResponse = await prisma.message.create({
    data: {
      chatId: conversationId.toString(),
      text: message.toString(),
      senderId: fromUserId.toString(),
      sendTime: new Date(),
      originalLanguageName,
      ordinal: lastMessage ? lastMessage.ordinal + 1 : 0,
    },
  });
  return createResponse;
};

export const getMessagesByIds = async (messageIds) => {
  const result = await prisma.message.findMany({
    where: { id: { in: messageIds } },
  });
  return result;
};

export const getUsersLanguages = async (userIds) => {
  const result = await prisma.languageAndLevel.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });
  return result;
};

export const getTranslation = async (
  id,
  originalLanguage,
  targetLanguage,
  text
) => {
  const result = await prisma.cachedTranslation.findFirst({
    where: {
      messageId: id.toString(),
      fromLanguageName: originalLanguage,
      toLanguageName: targetLanguage,
    },
  });
  return result;
};

export const getUserName = async (userId) => {
  const userNames = await prisma.profile.findFirst({
    where: {
      userId: userId.toString(),
    },
    select: {
      userId: true,
      firstName: true,
    },
  });

  return userNames;
};

export const insertCachedTranslation = async (translation) => {
  try {
    const result = await prisma.cachedTranslation.create({
      data: translation,
    });
  } catch (e) {
    return {
      ok: false,
      reason: "already exists",
      message: "Translation already exists.",
    };
  }
  return { ok: true };
};
