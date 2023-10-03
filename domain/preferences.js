import {
  getUserPreferences,
  updateGenderIdentity,
  updateGendersInterested,
  updateSexualities,
  addOrUpdateLanguages,
  deleteLanguages,
} from "../database/queries/preferences.js";
import {
  statusIds,
  genderIdentityIds,
  languageLevelIds,
  sexualityIds,
  languageIds,
} from "../database/constants.js";

export const getPreferences = async (userId) => {
  let result = await getUserPreferences(userId);
  if (result.length < 1) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user in the SQL database.",
    };
  }

  result = result[0];
  if (result.hasOwnProperty("accountStatus") && result["accountStatus"]) {
    result["statusId"] = statusIds[result["accountStatus"]];
    delete result["accountStatus"];
  }
  if (result.hasOwnProperty("genderIdentity") && result["genderIdentity"]) {
    result["genderIdentityId"] = genderIdentityIds[result["genderIdentity"]];
    delete result["genderIdentity"];
  }
  if (result.hasOwnProperty("userLanguages") && result["userLanguages"]) {
    result["userLanguages"] = result["userLanguages"].map((lang) => {
      if (lang.hasOwnProperty("languageLevel")) {
        lang["languageLevelId"] = languageLevelIds[lang["languageLevel"]];
        delete lang["languageLevel"];
      }
      if (lang.hasOwnProperty("languageName")) {
        lang["languageId"] = Object.keys(languageIds).find(
          (key) => languageIds[key] === lang["languageName"]
        );
        delete lang["languageName"];
      }

      return lang;
    });
  }
  if (result.hasOwnProperty("userSexualities") && result["userSexualities"]) {
    result["userSexualities"] = result["userSexualities"].map((s) => {
      return sexualityIds[s];
    });
  }
  if (
    result.hasOwnProperty("userInterestedInGenderIdentities") &&
    result["userInterestedInGenderIdentities"]
  ) {
    result["userInterestedInGenderIdentities"] = result[
      "userInterestedInGenderIdentities"
    ].map((s) => {
      return genderIdentityIds[s];
    });
  }

  return { ok: true, preferences: result };
};

export const setGenderIdentity = async (userId, genderIdentityId) => {
  const result = await updateGenderIdentity(
    userId,
    Object.keys(genderIdentityIds).find(
      (key) => genderIdentityIds[key] === genderIdentityId
    )
  );
  return result;
};

export const setGendersInterested = async (userId, genderIdentitiesIds) => {
  const genders = Object.keys(genderIdentityIds).filter((key) =>
    genderIdentitiesIds.includes(genderIdentityIds[key])
  );
  const result = await updateGendersInterested(userId, genders);
  return result;
};

export const setSexualities = async (userId, sexualitiesIds) => {
  const sexualities = Object.keys(sexualityIds).filter((key) =>
    sexualitiesIds.includes(sexualityIds[key])
  );
  const result = await updateSexualities(userId, sexualities);
  return result;
};

export const setLanguages = async (userId, userLanguages) => {
  try {
    const languages = userLanguages.map((lang) => {
      if (parseInt(lang.languageLevelId) === 1) {
        lang.isLearning = true;
      } else {
        lang.isLearning = false;
      }

      return {
        languageName: languageIds[lang.languageId],
        languageLevel: Object.keys(languageLevelIds).find(
          (key) => languageLevelIds[key] === lang.languageLevelId
        ),
        isLearning: lang.isLearning,
      };
    });
    const deleteResult = await deleteLanguages(userId, languages);
    const upsertResult = await addOrUpdateLanguages(userId, languages);
  } catch (e) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user in the SQL database.",
    };
  }

  return { ok: true };
};
