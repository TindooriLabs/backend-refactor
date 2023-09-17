import {
    createRelationship as createRelationshipDomain,
    getRelationshipsByType as getRelationshipsByTypeDomain
  } from "../domain/relationship.js";
  import { getFailureBody } from "./controller-helper.js";
  import { validateSchema } from "../util/schemas.js";
  
  export const createRelationship = async req => {
    //Validate body
    // const bodyValidation = validateSchema(req.body, "createRelationshipBody");
    // if (!bodyValidation.ok) {
    //   return getFailureBody(bodyValidation);
    // }
    // const paramsValidation = validateSchema(
    //   req.params,
    //   "createRelationshipParams"
    // );
    // if (!paramsValidation.ok) {
    //   return getFailureBody(paramsValidation);
    // }
    // const { userId } = req.user;
    const userId = 1;
    const { relationshipType: relationshipTypeName } = req.body;
    const { patientUserId } = req.params;
  
    const result = await createRelationshipDomain(
      userId,
      relationshipTypeName,
      parseInt(patientUserId)
    );
  
    //Return success
    if (result.ok) {
      return { status: 200, body: result.relationship };
    }
  
    return getFailureBody(result);
  };
  
  export const getUserRelationshipsByType = async req => {
    //Validate body
    // const bodyValidation = validateSchema(req.params, "getRelationshipsParams");
    // if (!bodyValidation.ok) {
    //   return getFailureBody(bodyValidation);
    // }
  
    // const { userId } = req.user;
    const userId = 1;
    const { relationshipType } = req.params;
  
    const result = await getRelationshipsByTypeDomain(userId, relationshipType);
  
    //Return success
    if (result.ok) {
      if (!result.relationships?.length) return { status: 204 };
  
      return { status: 200, body: result.relationships };
    }
  
    return getFailureBody(result);
  };
  