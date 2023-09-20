import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getChatById = async (chatId, pageLength, page) => {
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
        skip: pageLengthInt * (pageInt - 1),
        take: pageLengthInt,
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
  originalLanguageName = "en"
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
