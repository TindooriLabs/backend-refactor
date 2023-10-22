import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserSwipeSubscriptionInfo = async (userId) => {
  const userIdStr = `'${userId}'`;
  const result = await prisma.$queryRaw`${Prisma.raw(
    `SELECT usc."userId",
    se."subscriptionKind",
    usc."windowEnd",
    usc."remainingSwipes"
    FROM "UserSwipeCache" usc
    LEFT JOIN "SubscriptionEntry" se 
    ON usc."userId" = se."userId"
    WHERE usc."userId" = ${userIdStr};
    `
  )}`;

  return result;
};

export const upsertRelationship = async (
  agentUserId,
  relationshipTypeName,
  patientUserId
) => {
  const agentUserIdStr = `'${agentUserId}'`;
  const patientUserIdStr = `'${patientUserId}'`;
  const relationshipTypeNameStr = `'${relationshipTypeName}'`;
  const result = await prisma.$queryRaw`${Prisma.raw(
    `WITH upsert AS (
        INSERT INTO "UserImpressionBallot" ("fromUserId", impression, "toUserId", updated)
        VALUES (${agentUserIdStr}, ${relationshipTypeNameStr}, ${patientUserIdStr}, NOW())
        ON CONFLICT ("fromUserId", "toUserId") DO UPDATE
        SET impression = ${relationshipTypeNameStr}, updated = NOW()
        RETURNING "fromUserId", impression, "toUserId", updated
    )
    SELECT upsert."fromUserId" AS "upsertedAgentUserId",
           upsert.impression AS "upsertedUserRelationshipTypeName",
           upsert."toUserId" AS "upsertedPatientUserId",
           upsert.updated AS "upsertedUpdated",
           uib."fromUserId" AS "reciprocalAgentUserId",
           uib.impression AS "reciprocalUserRelationshipTypeName",
           uib."toUserId" AS "reciprocalPatientUserId",
           uib.updated AS "reciprocalUpdated"
    FROM upsert
    LEFT JOIN "UserImpressionBallot" uib ON
    upsert."toUserId" = uib."fromUserId" AND
    upsert."fromUserId" = uib."toUserId";
    `
  )}`;

  return result;
};

export const updateUserSwipeCache = async (
  userId,
  windowEnd,
  remainingSwipes
) => {
  try {
    const userIdStr = `'${userId}'`;
    const windowEndStr = `'${windowEnd}'`;
    const result = await prisma.$queryRaw`${Prisma.raw(
      `INSERT INTO "UserSwipeCache" ("userId", "windowEnd", "remainingSwipes")
    VALUES (${userIdStr}, TO_TIMESTAMP(${windowEndStr}, 'Dy, DD Mon YYYY HH24:MI:SS'), ${remainingSwipes})
    ON CONFLICT ("userId")
    DO UPDATE SET "windowEnd" = TO_TIMESTAMP(${windowEndStr}, 'Dy, DD Mon YYYY HH24:MI:SS'),
    "remainingSwipes" = ${remainingSwipes};
        `
    )}`;
  } catch (error) {
    return { ok: false };
  }
  return { ok: true };
};

export const getUserDevices = async (userId) => {
  const result = await prisma.userMetadata.findFirst({
    where: { userId: userId.toString() },
    include: { devices: true },
  });

  return result;
};

export const getUserRelationshipAggregatesByType = async (
  userId,
  relationshipAggregateType
) => {
  const userIdStr = `'${userId.toString()}'`;
  const relationshipAggregateTypeStr = `'${relationshipAggregateType}'`;
  const result = await prisma.$queryRaw`${Prisma.raw(
    `SELECT CASE WHEN "userId_A" = ${userIdStr} THEN "userId_B" ELSE "userId_A" END AS "userId",
    "userImpressionAggregateType" FROM userimpressionaggregate
    WHERE ("userId_A" = ${userIdStr} OR "userId_B" = ${userIdStr}) AND "userImpressionAggregateType" = ${relationshipAggregateTypeStr};`
  )}`;

  return result;
};

export const fetchLikesForUser = async (userId) => {
  const result = await prisma.userImpressionBallot.findMany({
    where: {
      toUserId: userId.toString(),
      impression: "LIKE",
    },
    select: {
      fromUserId: true,
    },
  });
  return result;
};
