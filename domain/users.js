import {
  getRequestingUserInfo,
  getUserInfo,
  updateUserStatus,
  updateUserSubscriptionTier,
  updateLocation,
  updateEthnicity,
  updateDob,
  createOrUpdateKarmaResponses,
} from "../database/queries/users.js";
import { getDistanceBetweenUsers } from "../util/location.js";
import {
  statusIds,
  ethnicityIds,
  subscriptionTierIds,
  genderIdentityIds,
  sexualityIds,
  languageIds,
  languageLevelIds
} from "../database/constants.js";

export const getUser = async (userId, requestingUserId) => {
  //Get data from Postgres
  let sqlResult = await getUserInfo(userId);
  if (sqlResult.length < 1) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user in the SQL database.",
    };
  }

  sqlResult = sqlResult[0];
  if (sqlResult.hasOwnProperty("accountStatus")) {
    if (sqlResult["accountStatus"]) {
      sqlResult["statusId"] = statusIds[sqlResult["accountStatus"]];
    } else {
      sqlResult["statusId"] = 1;
    }
    delete sqlResult["accountStatus"];
  }
  if (sqlResult.hasOwnProperty("ethnicity")) {
    if (sqlResult["ethnicity"]) {
      sqlResult["ethnicityId"] = ethnicityIds[sqlResult["ethnicity"]];
    } else {
      sqlResult["ethnicityId"] = null;
    }
    delete sqlResult["ethnicity"];
  }

  if (sqlResult.hasOwnProperty("images")) {
    if (sqlResult["images"]) {
      sqlResult["images"] = sqlResult["images"].map((image) => {
        image["s3Dir"] = image["s3Path"] || "";
        image["originalName"] =
          `${image["nameWithoutExtension"]}.${image["extension"]}` || "";
        ["userId", "s3Path", "nameWithoutExtension", "extension"].map(
          (key) => delete image[key]
        );
        return image;
      });
    }else{
      sqlResult["images"] = [];
    }
  }
  if (
    sqlResult.hasOwnProperty("subscriptionTier")
  ) {
    if(sqlResult["subscriptionTier"]){
    sqlResult["subscriptionTierId"] =
      subscriptionTierIds[sqlResult["subscriptionTier"]];
    }else{
      sqlResult["subscriptionTierId"] = 1;
    }
    delete sqlResult["subscriptionTier"];
  }

  if (sqlResult.hasOwnProperty("genderIdentity")) {
    if (sqlResult["genderIdentity"]) {
      sqlResult["genderIdentityId"] = genderIdentityIds[sqlResult["genderIdentity"]];
    } else {
      sqlResult["genderIdentityId"] = null;
    }
    delete sqlResult["genderIdentity"];
  }

  if (sqlResult.hasOwnProperty("userSexualities")) {
    if (sqlResult["userSexualities"]) {
      sqlResult["userSexualities"] = sqlResult["userSexualities"].map((s) => {
        return sexualityIds[s];
      });
    } else {
      sqlResult["userSexualities"] = [];
    }
  }

  if (sqlResult.hasOwnProperty("userLanguages")) {
    if (sqlResult["userLanguages"]) {
      sqlResult["userLanguages"] = sqlResult["userLanguages"].map((lang) => {
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
      sqlResult["userLanguages"] = [];
    }
  }

  //Get requesting user information
  let requestingUserInfo;
  if (requestingUserId && userId !== requestingUserId) {
    let requestingUserResult = await getRequestingUserInfo(requestingUserId);
    if (requestingUserResult.length < 1) {
      return {
        ok: false,
        reason: "not-found",
        message: "Could not find the requesting user in the SQL database.",
      };
    }

    requestingUserResult = requestingUserResult[0];
    requestingUserInfo = {
      distance: getDistanceBetweenUsers(requestingUserResult, sqlResult),
    };
  }

  const user = {
    ...sqlResult,
    ...requestingUserInfo,
    id: sqlResult.id,
  };
  return { ok: true, user };
};

export const setStatus = async (userId, status) => {
  //Get data from Postgres
  const result = await updateUserStatus(userId, status);
  return result;
};

export const setSubscription = async (userId, subscriptionTierId) => {
  let subscriptionTier = Object.keys(subscriptionTierIds).find(
    (key) => subscriptionTierIds[key] === subscriptionTierId
  );
  const result = await updateUserSubscriptionTier(userId, subscriptionTier);
  return result;
};

export const setLocation = async (userId, lat, lon) => {
  const result = await updateLocation(userId, lat, lon);
  return result;
};

export const setEthnicity = async (userId, ethnicityId) => {
  let ethnicity = Object.keys(ethnicityIds).find(
    (key) => ethnicityIds[key] === ethnicityId
  );
  const result = await updateEthnicity(userId, ethnicity);
  return result;
};

export const setDob = async (userId, dob) => {
  const result = await updateDob(userId, dob);
  return result;
};

export const setKarmaResponses = async (
  userId,
  ratingUserId,
  karmaResponses
) => {
  try {
    const result = await createOrUpdateKarmaResponses(
      userId,
      ratingUserId,
      karmaResponses
    );
  } catch (e) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user in the SQL database.",
    };
  }

  return { ok: true };
};
