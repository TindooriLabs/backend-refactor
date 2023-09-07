import { getRequestingUserInfo, getUserInfo } from "../database/queries/users.js";
import { getDistanceBetweenUsers } from "../util/location.js";
import { statusIds, ethnicityIds } from "../database/constants.js";

export const getUser = async (userId, requestingUserId) => {
    //Get data from Postgres
    let sqlResult = await getUserInfo(userId);
    
    if (sqlResult.length < 1) {
      return {
        ok: false,
        reason: "not-found",
        message: "Could not find the user in the SQL database."
      };
    }

    sqlResult = sqlResult[0];
    if(sqlResult.hasOwnProperty('accountStatus')){
      sqlResult['statusId'] = statusIds[sqlResult['accountStatus']];
      delete sqlResult['accountStatus'];
    }
    if(sqlResult.hasOwnProperty('ethnicity')){
      sqlResult['ethnicityId'] = ethnicityIds[sqlResult['ethnicity']];
      delete sqlResult['ethnicity'];
    }
  
    //Get requesting user information
    let requestingUserInfo;
    if (requestingUserId && userId !== requestingUserId) {
      let requestingUserResult = await getRequestingUserInfo(requestingUserId);
      if (requestingUserResult.length < 1) {
        return {
          ok: false,
          reason: "not-found",
          message: "Could not find the requesting user in the SQL database."
        };
      }
  
      requestingUserResult = requestingUserResult[0];
      requestingUserInfo = {
        distance: getDistanceBetweenUsers(
          requestingUserResult,
          sqlResult
        )
      };
    }
  
    const user = {
      ...sqlResult,
      ...requestingUserInfo,
      _id: undefined,
      userId: undefined,
      id: sqlResult.userId
    };
    return { ok: true, user };
  };