import {
  getRequestingUserInfo,
  getUserInfo,
  updateUserStatus,
  updateUserSubscriptionTier,
  updateLocation,
  updateEthnicity,
  updateDob,
  createOrUpdateKarmaResponses,
  getSubscriptionEntryForUser,
  deleteUser,
} from "../database/queries/users.js";
import { getDistanceBetweenUsers } from "../util/location.js";
import {
  statusIds,
  ethnicityIds,
  subscriptionTierIds,
  genderIdentityIds,
  sexualityIds,
  languageIds,
  languageLevelIds,
} from "../database/constants.js";

import axios from "axios";

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
    } else {
      sqlResult["images"] = [];
    }
  }
  if (sqlResult.hasOwnProperty("subscriptionTier")) {
    if (sqlResult["subscriptionTier"]) {
      sqlResult["subscriptionTierId"] =
        subscriptionTierIds[sqlResult["subscriptionTier"]];
    } else {
      sqlResult["subscriptionTierId"] = 1;
    }
    delete sqlResult["subscriptionTier"];
  }

  if (sqlResult.hasOwnProperty("genderIdentity")) {
    if (sqlResult["genderIdentity"]) {
      sqlResult["genderIdentityId"] =
        genderIdentityIds[sqlResult["genderIdentity"]];
    } else {
      sqlResult["genderIdentityId"] = null;
    }
    delete sqlResult["genderIdentity"];
  }

  if (sqlResult.hasOwnProperty("gendersOfInterest")) {
    if (sqlResult["gendersOfInterest"]) {
      sqlResult["gendersOfInterest"] = sqlResult["gendersOfInterest"].map(
        (gender) => genderIdentityIds[gender]
      );
    } else {
      sqlResult["gendersOfInterest"] = null;
    }
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
  if (sqlResult.hasOwnProperty("karmaScore") && sqlResult["karmaScore"]) {
    sqlResult.karmaScore = sqlResult.karmaScore.toString();
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
  let expiration = null;
  if (subscriptionTierId === 2) {
    expiration = new Date(new Date().addMonths(1).setUTCHours(23, 59, 59, 999));
  } else {
    expiration = new Date();
  }
  const result = await updateUserSubscriptionTier(
    userId,
    subscriptionTier,
    expiration
  );
  return result;
};

export const getSubscription = async (userId) => {
  const result = await getSubscriptionEntryForUser(userId);
  if (result) {
    return { ok: true, result };
  }
  return {
    ok: false,
    reason: "not-found",
    message: "Could not find user subscription info in the database",
  };
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

export const removeUser = async (userId) => {
  const deleteResponse = await deleteUser(userId);
  return deleteResponse;
};

export const validateReceipt = async ( receiptData) => {
  try {
    // Use the sandbox URL during development
    const url =
      process.env.ENV === "prod"
        ? "https://buy.itunes.apple.com/verifyReceipt"
        : "https://sandbox.itunes.apple.com/verifyReceipt";
    const receiptDataDecoded = Buffer.from(base64Receipt, 'base64').toString('binary');
    const validationResponse = await validate(receiptDataDecoded, url);

    if (
      validationResponse.status === 200 &&
      validationResponse.data.status === 0
    ) {
      // Receipt is valid
      return { ok: true, result: { isValid: true } };
    } else {
      // Receipt is invalid
      return {
        ok: true,
        result: { isValid: false, reason: validationResponse.data },
      };
    }
  } catch (error) {
    console.error("Error validating receipt:", error);
    return {
      ok: false,
      reason: "server-error",
      message: error.message,
    };
  }
};

async function validate(receiptData, url) {
  const requestData = { "receipt-data": receiptData };

  const response = await axios.post(url, requestData);
  return response;
}
