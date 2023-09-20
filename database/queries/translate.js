import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getTranslation = async (
  originalLanguage,
  targetLanguage,
  text
) => {
  const result = await prisma.cachedTranslation.findFirst({
    where: {
      fromLanguageName: originalLanguage,
      toLanguageName: targetLanguage,
      sourceText: text,
    },
  });
};
