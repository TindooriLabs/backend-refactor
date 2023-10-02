import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserPreferences = async (id) => {
  const userPreferences = await prisma.$queryRaw`SELECT  
    pr."userId",
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
        languageName: { notIn: languages.map((lang) => lang.languageName) },
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
   ON CONFLICT ("userId", "languageName") DO
   UPDATE SET "languageLevel" = EXCLUDED."languageLevel", "isLearning" = EXCLUDED."isLearning";`)}`;

  return result;
};
