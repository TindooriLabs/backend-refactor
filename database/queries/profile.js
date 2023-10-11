import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrUpdateProfile = async (userId, profile) => {
  let firstName;
  if (!profile.hasOwnProperty("name")) {
    firstName = "";
  } else {
    firstName = profile.name;
    delete profile["firstName"];
  }

  const result = await prisma.profile.upsert({
    where: { userId: userId.toString() },
    update: profile,
    create: {
      ...profile,
      userId: userId.toString(),
      firstName,
    },
  });
  return result;
};

export const getProfilePrompts = async (userId) => {
  const prompts = await prisma.promptResponse.findMany({
    where: { userId: userId.toString() },
    select: {
      userId: true,
      question: true,
      response: true,
    },
  });
  return prompts;
};

export const createOrUpdatePrompt = async (
  userId,
  promptId,
  prompt,
  response
) => {
  if (!promptId) {
    let text = prompt ? `${prompt}` : "";
    let result = await prisma.$queryRaw`INSERT INTO "PromptQuestion" ("text")
    VALUES(${text})  RETURNING id;`;
    if (result.length > 0 && result[0].id) {
      await prisma.promptResponse.create({
        data: {
          userId: userId.toString(),
          questionId: result[0].id,
          response,
        },
      });
    }
  } else {
    let promptPresent = prompt ? true : false;
    let checkPrompt = await prisma.promptQuestion.findFirst({
      where: {
        id: promptId,
      },
    });
    let promptObj = {
      id: promptId,
    };
    if (promptPresent) {
      promptObj["text"] = prompt;
    }
    if (checkPrompt && checkPrompt.id) {
      await prisma.$transaction([
        prisma.promptQuestion.update({
          where: { id: promptId },
          data: {
            ...promptObj,
          },
        }),
        prisma.promptResponse.update({
          where: {
            userId_questionId: {
              userId: userId.toString(),
              questionId: promptId,
            },
          },
          data: {
            response,
          },
        }),
      ]);
    } else {
      let text = prompt ? `${prompt}` : "";
      let result = await prisma.$queryRaw`INSERT INTO "PromptQuestion" 
      VALUES(${text})  RETURNING id;`;
      if (result.length > 0 && result[0].id) {
        await prisma.promptResponse.create({
          data: {
            userId: userId.toString(),
            questionId: result[0].id,
            response,
          },
        });
      }
    }
  }
  return { ok: true };
};

export const deletePromptResponse = async (userId, promptId) => {
  try {
    await prisma.promptResponse.deleteMany({
      where: {
        userId_questionId: {
          userId: userId.toString(),
          questionId: promptId,
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the user prompt in the SQL database.",
        };
      }
    }
  }

  return { ok: true };
};

export const getInterests = async (userId) => {
  const interests = await prisma.profile.findFirst({
    where: { userId: userId.toString() },
    select: {
      interests: true,
    },
  });
  return interests;
};

export const insertInterests = async (userId, interests) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        interests: {
          push: interests,
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the user profile in the SQL database.",
        };
      }
    }
  }
};

export const updateInterests = async (userId, interests) => {
  try {
    await prisma.profile.update({
      where: {
        userId: userId.toString(),
      },
      data: {
        interests: {
          set: interests,
        },
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the user profile in the SQL database.",
        };
      }
    }
  }
  return { ok: true };
};

export const getUserSubscriptionInfo = async (userId) => {
  const subscriptionInfo = await prisma.subscriptionEntry.findFirst({
    where: { userId: userId.toString() },
    select: {
      subscriptionKind: true,
    },
  });
  return subscriptionInfo;
};

export const findUsers = async (
  userId,
  minAge,
  maxAge,
  maxResults,
  maxDistance,
  showRelationshipInfo
) => {
  const userIdStr = `'${userId.toString()}'`;
  const result = await prisma.$queryRaw`${Prisma.raw(
  `with base_profile as (select * from "Profile" where "userId" = ${userIdStr} limit 1),
  base_profile_interested_in_genders as (select "userId", "gendersOfInterest" from "Profile" pr where "userId" = ${userIdStr})
  select pr."userId" "id", pr."firstName" "name", date_part('year', age(now(), pr."birthDate")) age,
  pr."genderIdentity", pr.ethnicity, ROUND(km.sum::decimal/km.count, 2)::float8 "karmaScore",
  round(point(pr.longitude,pr.latitude) <@> point((select longitude from base_profile),(select latitude from base_profile))) "distance",
  case when ${showRelationshipInfo} then uib.impression else null end "existingRelationshipType",
  case when ${showRelationshipInfo} then uia."userImpressionAggregateType" else null end  "userRelationshipAggregateType",
  ll.user_languages "languages", pr.sexuality
  from "Profile" pr left join "KarmaScore" km ON pr."userId" = km."userId"
  left join "UserImpressionBallot" uib on uib."toUserId" = ${userIdStr} and pr."userId" = uib."fromUserId"
  left join "userimpressionaggregate" uia on (pr."userId" = uia."userId_A" or pr."userId" = uia."userId_B") and (${userIdStr} = uia."userId_A" or ${userIdStr} = uia."userId_B")
  left join (
    select  "userId", json_agg(json_build_object('languageName', ll."languageName",'languageLevel', ll."languageLevel")) user_languages
    from "LanguageAndLevel" ll 
    group by "userId"	
  ) ll on ll."userId" = pr."userId"
  where
  pr."userId" != ${userIdStr}
  and ${parseFloat(
    maxDistance
  )} >= (point(pr.longitude,pr.latitude) <@> point((select longitude from base_profile),(select latitude from base_profile)))
  and date_part('year', age(now(), pr."birthDate")) between ${parseFloat(
    minAge
  )} and ${parseFloat(maxAge)}
  and pr."genderIdentity" = ANY(ARRAY(select "gendersOfInterest" from base_profile_interested_in_genders))
  and (uia."userImpressionAggregateType" is null or uia."userImpressionAggregateType" = 'INCOMPLETE')
  limit ${parseInt(maxResults)};
`)}`;

  return result;
};

export const getImagesMetaByUserId = async (userId, ordinal) => {
  let whereCondition = { userId: userId.toString() };
  if (ordinal !== null) {
    whereCondition["ordinal"] = parseInt(ordinal);
  }
  const result = await prisma.imageUpload.findMany({
    where: { userId: userId.toString() },
  });
  return result;
};

export const insertImageData = async (userId, fileMeta) => {
  const result = await prisma.imageUpload.create({
    data: {
      userId: userId.toString(),
      ...fileMeta,
    },
  });
  return result;
};

export const deleteImageData = async (userId, ordinal) => {
  const result = await prisma.imageUpload.delete({
    where: { userId_ordinal: { userId: userId.toString(), ordinal } },
  });

  return result;
};

export const updateImageData = async (userId, newImageMeta) => {
  const result = await prisma.$transaction(
    newImageMeta.map((image) => {
     return prisma.imageUpload.update({
        where: { id: image.id },
        data: {
          ordinal: image.ordinal,
        },
      });
    })
  );

  return { ok: true };
};
