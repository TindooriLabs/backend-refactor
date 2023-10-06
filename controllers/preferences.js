import {
  getPreferences as getPreferencesDomain,
  setGenderIdentity as setGenderIdentityDomain,
  setGendersInterested as setGendersInterestedDomain,
  setSexualities as setSexualitiesDomain,
  setLanguages as setLanguagesDomain
} from "../domain/preferences.js";
import { getFailureBody } from "./controller-helper.js";
import { validateSchema } from "../util/schemas.js";

export const getPreferences = async (req) => {
  const { userId } = req.user;
  

  const result = await getPreferencesDomain(userId);

  //Return success
  if (result.ok) {
    return { status: 200, body: result.preferences };
  }

  return getFailureBody(result);
};

export const setGenderIdentity = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setGenderIdentityBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { genderIdentityId } = req.body;
  const { userId } = req.user;
  

  const result = await setGenderIdentityDomain(userId, genderIdentityId);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const setGendersInterested = async req => {
    //Validate body
    const validation = validateSchema(req.body, "setGendersInterestedBody");
    if (!validation.ok) {
      return getFailureBody(validation);
    }
    const { genderIdentityIds } = req.body;
    const { userId } = req.user;
   
  
    const result = await setGendersInterestedDomain(userId, genderIdentityIds);
  
    //Return success
    if (result.ok) {
      return { status: 204 };
    }
  
    return getFailureBody(result);
  };

  export const setSexualities = async req => {
    //Validate body
    const validation = validateSchema(req.body, "setSexualitiesBody");
    if (!validation.ok) {
      return getFailureBody(validation);
    }
    const { sexualityIds } = req.body;
    const { userId } = req.user;
    
  
    const result = await setSexualitiesDomain(userId, sexualityIds);
  
    //Return success
    if (result.ok) {
      return { status: 204 };
    }
  
    return getFailureBody(result);
  };

  export const setLanguages = async req => {
    //Validate body
    const validation = validateSchema(req.body, "setLanguagesBody");
    if (!validation.ok) {
      return getFailureBody(validation);
    }
    const { userLanguages } = req.body;
    const { userId } = req.user;
    
  
    const result = await setLanguagesDomain(userId, userLanguages);
  
    //Return success
    if (result.ok) {
      return { status: 204 };
    }
  
    return getFailureBody(result);
  };
