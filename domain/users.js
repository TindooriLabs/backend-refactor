import {
    runQuery,
    queries,
  } from "../database/postgres.js";
import { getDistanceBetweenUsers } from "../util/location.js";
import { statusIds, ethnicityIds, subscriptionTierIds, genderIdentityIds, sexualityIds, langugaeLevelIds,  } from "../database/constants.js"

export const getUser = async (userId, requestingUserId) => {
    //Get data from Postgres
    const sqlResult = await runQuery(
      queries.getUserWithPreferences(userId),
      null,
      "user",
      true
    );
  
    if (!sqlResult.ok) {
      return { ok: false };
    }
    if (sqlResult.rowsAffected < 1) {
      return {
        ok: false,
        reason: "not-found",
        message: "Could not find the user in the SQL database."
      };
    }

    console.log(sqlResult);
    if(sqlResult.user.hasOwnProperty('accountStatus')){
      sqlResult.user['status_id'] = statusIds[sqlResult.user['accountStatus']];
      delete sqlResult.user['accountStatus'];
    }
    if(sqlResult.user.hasOwnProperty('ethnicity')){
      sqlResult.user['ethnicity_id'] = ethnicityIds[sqlResult.user['ethnicity']];
      delete sqlResult.user['ethnicity'];
    }
    if(sqlResult.user.hasOwnProperty('subscriptionKind')){
      sqlResult.user['subscription_tier_id'] = subscriptionTierIds[sqlResult.user['subscriptionKind']];
      delete sqlResult.user['subscriptionKind'];
    }
    if(sqlResult.user.hasOwnProperty('genderIdentity')){
      sqlResult.user['gender_identity_id'] = genderIdentityIds[sqlResult.user['genderIdentity']];
      delete sqlResult.user['genderIdentity'];
    }
    if(sqlResult.user.hasOwnProperty('userSexualities')){
      sqlResult.user['userSexualities'] = sqlResult.user['userSexualities'].match(/[\w.-]+/g).map(String);
      sqlResult.user['userSexualities'] = sqlResult.user['userSexualities'].map((element)=>{
        return sexualityIds[element];
      });
    }
    if(sqlResult.user.hasOwnProperty('userInterestedInGenderIdentities')){
      sqlResult.user['userInterestedInGenderIdentities'] = sqlResult.user['userInterestedInGenderIdentities'].match(/[\w.-]+/g).map(String);
      sqlResult.user['userInterestedInGenderIdentities'] = sqlResult.user['userInterestedInGenderIdentities'].map((element)=>{
        return genderIdentityIds[element];
      });
    }
    if(sqlResult.user.hasOwnProperty('userLanguages')){
      sqlResult.user['userLanguages'] = sqlResult.user['userLanguages'].map((element) => {
        return {
          "languageId": element.languageName,
          "languageLevelId": langugaeLevelIds[element.languageLevel]
        }
      });
    }
  
    //Get requesting user information
    let requestingUserInfo;
    if (requestingUserId && userId !== requestingUserId) {
      const requestingUserResult = await runQuery(
        queries.getUser(requestingUserId),
        null,
        "user",
        true
      );
  
      if (!requestingUserResult.ok) {
        return { ok: false };
      }
  
      if (requestingUserResult.rowsAffected < 1) {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the requesting user in the SQL database."
        };
      }
  console.log(requestingUserResult);
      requestingUserInfo = {
        distance: getDistanceBetweenUsers(
          requestingUserResult.user,
          sqlResult.user
        )
      };
    }
  
    //Get data from Mongo
    // const mongoProfile = await Profile.getById(userId);
    // const mongoUser = await User.getInfoById(userId);
  
    const user = {
      ...sqlResult.user,
    //   ...mongoUser,
    //   ...mongoProfile,
      ...requestingUserInfo,
      _id: undefined,
      userId: undefined,
      id: sqlResult.user.userId
    };
  
    return { ok: true, user };
  };