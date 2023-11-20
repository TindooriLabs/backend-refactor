import {
  getUserPreferences,
  updateGenderIdentity,
  updateGendersInterested,
  updateSexualities,
  addOrUpdateLanguages,
  deleteLanguages,
  updateIsApi,
  getApi
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
  if (result.hasOwnProperty("accountStatus")) {
    if (result["accountStatus"]) {
      result["statusId"] = statusIds[result["accountStatus"]];
    } else {
      result["statusId"] = 1;
    }
    delete result["accountStatus"];
  }
  if (result.hasOwnProperty("genderIdentity")) {
    if (result["genderIdentity"]) {
      result["genderIdentityId"] = genderIdentityIds[result["genderIdentity"]];
    } else {
      result["genderIdentityId"] = null;
    }
    delete result["genderIdentity"];
  }
  if (result.hasOwnProperty("userLanguages")) {
    if (result["userLanguages"]) {
      result["userLanguages"] = result["userLanguages"].map((lang) => {
        if (lang.hasOwnProperty("languageLevel")) {
          if (lang["languageLevel"]) {
            lang["languageLevelId"] = languageLevelIds[lang["languageLevel"]];
          } else {
            lang["languageLevelId"] = null;
          }
          delete lang["languageLevel"];
        }
        if (lang.hasOwnProperty("languageName")) {
          if (lang["languageName"]) {
            lang["languageId"] = Object.keys(languageIds).find(
              (key) => languageIds[key] === lang["languageName"]
            );
          } else {
            lang["languageId"] = null;
          }
          delete lang["languageName"];
        }

        return lang;
      });
    } else {
      result["userLanguages"] = [];
    }
  }
  if (result.hasOwnProperty("userSexualities")) {
    if (result["userSexualities"]) {
      result["userSexualities"] = result["userSexualities"].map((s) => {
        return sexualityIds[s];
      });
    } else {
      result["userSexualities"] = [];
    }
  }
  if (result.hasOwnProperty("userInterestedInGenderIdentities")) {
    if (result["userInterestedInGenderIdentities"]) {
      result["userInterestedInGenderIdentities"] = result[
        "userInterestedInGenderIdentities"
      ].map((s) => {
        return genderIdentityIds[s];
      });
    } else {
      result["userInterestedInGenderIdentities"] = [];
    }
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
    let languages = userLanguages.map((lang) => {
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
    let langMap = {};
    let langSet = new Set();
    /*
    languages.map((lang) => {
      if (langSet.has(lang.languageName)) {
        //if (lang.languageLevel !== "WANT_TO_LEARN") {
          langMap[lang.languageName].languageLevel = lang.languageLevel;
        //}
        langMap[lang.languageName].isLearning = true;
      } else {
        langSet.add(lang.languageName);
        langMap[lang.languageName] = {
          languageLevel: lang.languageLevel,
          isLearning: lang.isLearning,
        };
      }
    });
    languages = [];
    for (let key in langMap) {
      languages.push({
        languageName: key,
        languageLevel: langMap[key].languageLevel,
        isLearning: langMap[key].isLearning,
      });
    }
    */
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

export const setApi= async (userId, isApi) => {
  const result = await updateIsApi(
    userId,
    isApi
  );
  return result;
};

export const getIsApi = async (userId) => {
  let isApi = await getApi(userId);
  return { ok: true, isApi };
};