import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserInfo = async (id) => {
  const userInfo = await prisma.$queryRaw`select  pr."userId" "id",
  pr."firstName" "name",
  pr."birthDate" "dob",
  pr."longitude" "lastLon",
  pr."latitude" "lastLat",
  um."accountStatus",
  pr."ethnicity",
  ROUND(km.sum::decimal/km.count, 2)::float8 "karmaScore",
  ac.email,
  ac.mobile,
  pr.hometown,
  pr.bio,
  iu."imageUploads" "images",
  se."subscriptionKind" "subscriptionTier",
  pr.interests,
  prompt."promptResponses" "prompts"
from "Profile" pr
left join "UserMetadata" um ON pr."userId" = um."userId"
left join "SubscriptionEntry" se ON pr."userId" = se."userId"
left join "KarmaScore" km ON pr."userId" = km."userId"
left join "Account" ac ON pr."userId" = ac."userId"
left join (
select "userId", json_agg(json_build_object(
'id', iu.id, 'userId', iu."userId", 'ordinal', iu.ordinal, 
's3Path', iu."s3Path", 'nameWithoutExtension', iu."nameWithoutExtension", 
'extension', iu.extension)) "imageUploads" 
from "ImageUpload" iu 
group by "userId"
) iu on iu."userId" = pr."userId"
left join (
select "userId", json_agg(json_build_object(prompt."questionId", prompt.response)) "promptResponses"
from "PromptResponse" prompt
group by "userId"
) prompt on prompt."userId" = pr."userId"
where pr."userId" = ${id.toString()}`;
  return userInfo;
};

export const getRequestingUserInfo = async (id) => {
  const requestingUserInfo =
    await prisma.$queryRaw`select  pr."userId" "id",
  pr."firstName" "name",
  pr."birthDate" "dob",
  pr."longitude" "lastLon",
  pr."latitude" "lastLat",
  um."accountStatus",
  pr."ethnicity",
  pr.bio,
  iu."imageUploads" "images",
  pr.interests,
  prompt."promptResponses" "prompts"
from "Profile" pr
left join "UserMetadata" um ON pr."userId" = um."userId"
left join (
select "userId", json_agg(json_build_object(
'id', iu.id, 'userId', iu."userId", 'ordinal', iu.ordinal, 
's3Path', iu."s3Path", 'nameWithoutExtension', iu."nameWithoutExtension", 
'extension', iu.extension)) "imageUploads" 
from "ImageUpload" iu 
group by "userId"
) iu on iu."userId" = pr."userId"
left join (
select "userId", json_agg(json_build_object(prompt."questionId", prompt.response)) "promptResponses"
from "PromptResponse" prompt
group by "userId"
) prompt on prompt."userId" = pr."userId"
where pr."userId" = ${id.toString()}`;
  return requestingUserInfo;
};

export const getUserChatsWithLastMessage = async (id) => {
  const userChats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { id: id.toString() },
      },
    },
    include: {
      participants: true,
      messages: {
        orderBy: {
          sendTime: "desc",
        },
        take: 1,
      },
    },
  });

  return userChats;
};

export const getUserNames = async (ids) => {
  const userNames = await prisma.profile.findMany({
    where: {
      userId: {
        in: ids,
      },
    },
    select: {
      userId: true,
      firstName: true,
    },
  });

  return userNames;
};

export const updateUserStatus = async (userId, status) => {
  try {
    await prisma.userMetadata.update({
      where: { userId: userId.toString() },
      data: {
        accountStatus: status.toString(),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the user metadata in the SQL database.",
        };
      }
    }
  }

  return { ok: true };
};

export const updateUserSubscriptionTier = async (userId, subscriptionTier) => {
  try {
    await prisma.subscriptionEntry.update({
      where: { userId: userId.toString() },
      data: {
        subscriptionKind: subscriptionTier.toString(),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message:
            "Could not find the user subscription entry in the SQL database.",
        };
      }
    }
  }

  return { ok: true };
};

export const updateLocation = async (userId, lat, lon) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        latitude: lat,
        longitude: lon,
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

  return { ok: true };
};

export const updateEthnicity = async (userId, ethnicity) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        ethnicity: ethnicity.toString(),
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

  return { ok: true };
};

export const updateDob = async (userId, dob) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        birthDate: dob.toString(),
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

  return { ok: true };
};

export const createOrUpdateKarmaResponses = async (
  userId,
  ratingUserId,
  karmaResponses
) => {
  const userIdStr = `'${userId}'`;
  const ratingUserIdStr = `'${ratingUserId}'`;
  const values = karmaResponses
    .map((kr) => {
      return `( ${ratingUserIdStr}, ${userIdStr}, ${kr.questionId}, ${kr.rating} )`;
    })
    .join();

  const result =
    await prisma.$queryRaw`${Prisma.raw(`INSERT INTO "KarmaBallot" VALUES
    ${values}
  ON CONFLICT ("fromUserId", "toUserId", "questionIndex") DO
  UPDATE SET score = EXCLUDED.score;`)}`;

  return result;
};
