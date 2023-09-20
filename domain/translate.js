import { getTranslation } from "../database/queries/translate.js";

export const getCachedTranslationForMessage = async (
  message,
  targetLanguage
) => {
  const today = new Date();
  const result = await getTranslation(
    message.originalLanguageName,
    targetLanguage,
    message.text
  );
  const cachedTranslation = message.translations?.[targetLanguage];

  //Valid cached translation
  if (cachedTranslation && today.isBefore(cachedTranslation.expiration)) {
    return cachedTranslation;
  }

  return null;
};
