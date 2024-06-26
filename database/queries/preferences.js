import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserPreferences = async (id) => {
  const userPreferences = await prisma.$queryRaw`SELECT  
    pr."userId" "id",
    pr."longitude" "lastLon",
    pr."latitude" "lastLat",
    um."accountStatus",
    pr."birthDate" "dob",
    pr."genderIdentity",
    ll."userLanguages",
    pr.sexuality "userSexualities",
    pr."gendersOfInterest" "userInterestedInGenderIdentities"
    FROM "Profile" pr
    LEFT JOIN "UserMetadata" um ON pr."userId" = um."userId"
    LEFT JOIN (
        SELECT "userId", JSON_AGG(JSON_BUILD_OBJECT('languageName', ll."languageName", 'languageLevel', ll."languageLevel", 'isLearning', ll."isLearning")) "userLanguages"
        FROM "LanguageAndLevel" ll
        GROUP BY "userId"
        ) ll on ll."userId" = pr."userId"
    WHERE pr."userId" = ${id.toString()};`;
  return userPreferences;
};

export const updateGenderIdentity = async (userId, genderIdentity) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        genderIdentity: genderIdentity.toString(),
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

export const updateGendersInterested = async (userId, gendersInterested) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        gendersOfInterest: gendersInterested,
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

export const updateSexualities = async (userId, sexualities) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        sexuality: sexualities,
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

export const deleteLanguages = async (userId, languages) => {
  try {
    await prisma.languageAndLevel.deleteMany({
      where: {
        userId: userId.toString(),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return {
          ok: false,
          reason: "not-found",
          message:
            "Could not find the user language preference in the SQL database.",
        };
      }
    }
  }

  return { ok: true };
};

export const addOrUpdateLanguages = async (userId, languages) => {
  try {
    const userIdStr = `'${userId}'`;
    const values = languages
      .map((lang) => {
        let langNameStr = `'${lang.languageName}'`;
        let langLevelStr = `'${lang.languageLevel}'`;
        return `( ${userIdStr}, ${langNameStr}, ${langLevelStr}, ${lang.isLearning}  )`;
      })
      .join();

    const result =
      await prisma.$queryRaw`${Prisma.raw(`INSERT INTO "LanguageAndLevel" 
   VALUES ${values} 
   ON CONFLICT ("userId", "languageName", "isLearning") DO
   UPDATE SET "languageLevel" = EXCLUDED."languageLevel", "isLearning" = EXCLUDED."isLearning";`)}`;

    return result;
  } catch (e) {
    return {
      ok: false,
      reason: "server-error",
      message: "Error setting languages for user",
    };
  }
};

export const updateIsApi = async (userId, isApi) => {
  try {
    await prisma.profile.update({
      where: { userId: userId.toString() },
      data: {
        isApi: isApi,
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

export const getApi = async (userId) => {
  const result = await prisma.profile.findFirst({
    where: { userId },
    select: {isApi: true}
  });
  return result;
};