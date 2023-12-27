import Joi from "joi";
import {
  statusIds,
  subscriptionTierIds,
  ethnicityIds,
  genderIdentityIds,
  sexualityIds,
  languageLevelIds,
  relationshipTypeIds,
  userRelationshipAggregateTypeIds,
} from "../database/constants.js";
import ISO from "iso-639-1";

let schemas = {};

export const setSchemas = async () => {
  //Components
  const dbId = Joi.string().uuid();
  const dbIdArray = Joi.array().items(dbId);
  //   const mongoId = Joi.objectId();
  // const email = Joi.string().email();
  const email = Joi.string()
  const password = Joi.string();
  const dob = Joi.string().isoDate();
  const age = Joi.number();
  const latitude = Joi.number().min(-90).max(90);
  const longitude = Joi.number().min(-180).max(180);
  const pageLength = Joi.number().positive();
  const page = Joi.number().positive();
  const imageOrdinal = Joi.number();
  const phoneNumber = Joi.string().length(11);
  const verificationCode = Joi.string().length(6);
  const statusName = Joi.string().valid(...Object.keys(statusIds));
  const statusId = Joi.number().valid(...Object.values(statusIds));
  const ethnicityId = Joi.number().valid(...Object.values(ethnicityIds));
  const relationshipTypeName = Joi.string().valid(
    ...Object.keys(relationshipTypeIds)
  );
  const relationshipAggregateTypeName = Joi.string().valid(
    ...Object.keys(userRelationshipAggregateTypeIds)
  );
  const sexualityId = Joi.string().valid(...Object.values(sexualityIds));
  const genderIdentityId = Joi.string().valid(
    ...Object.values(genderIdentityIds)
  );
  const languageLevelId = Joi.string().valid(
    ...Object.values(languageLevelIds)
  );
  const subscriptionTierId = Joi.valid(...Object.values(subscriptionTierIds));
  const languageIso = Joi.string().valid(...ISO.getAllCodes());
  const userLanguage = Joi.object().keys({
    languageId: languageIso,
    languageLevelId,
  });
  const karmaResponses = Joi.object().keys({
    questionId: Joi.number(),
    rating: Joi.number().min(1).max(5),
  });
  const bio = Joi.string().max(500);
  const interest = Joi.string().max(100);

  //Notifications
  const apnId = Joi.string(); //Apple Push Notification device ID

  //   //User
  schemas.getUserParams = Joi.object().keys({
    userId: dbId.required(),
  });
  schemas.setStatusBody = Joi.object().keys({
    status: statusName.required(),
  });
  schemas.verifyAccountBody = Joi.object().keys({
    code: verificationCode.required(),
    appleDeviceId: apnId.required()
  });
  schemas.setSubscriptionBody = Joi.object().keys({
    subscriptionTierId: subscriptionTierId.required(),
    expiration: Joi.string().isoDate().optional()
  });
  //   schemas.statusId = statusId.required();
  schemas.setLocationBody = Joi.object().keys({
    lat: latitude.required(),
    lon: longitude.required(),
  });
  schemas.setEthnicityBody = Joi.object().keys({
    ethnicityId: ethnicityId.required(),
  });
  schemas.setGenderIdentityBody = Joi.object().keys({
    genderIdentityId: genderIdentityId.required(),
  });
  schemas.setGendersInterestedBody = Joi.object().keys({
    genderIdentityIds: Joi.array().items(genderIdentityId).required(),
  });
  schemas.setSexualitiesBody = Joi.object().keys({
    sexualityIds: Joi.array().items(sexualityId).required(),
  });
  schemas.setLanguagesBody = Joi.object().keys({
    userLanguages: Joi.array().items(userLanguage).required(),
  });
  schemas.setDobBody = Joi.object().keys({
    dob: dob.required(),
  });
  schemas.setKarmaResponsesBody = Joi.object().keys({
    karmaResponses: Joi.array().items(karmaResponses).required(),
  });

  //Conversation
  schemas.getConversationParams = Joi.object().keys({
    conversationId: Joi.string().required(),
  });
  schemas.getUserConversationsParams = Joi.object().keys({
    userId: dbId,
  });
  schemas.getConversationQuery = Joi.object().keys({
    pageLength: pageLength.optional(),
    page: page.optional(),
  });
  schemas.sendMessageBody = Joi.object()
    .keys({
      toUserIds: dbIdArray,
      conversationId: Joi.string(),
      message: Joi.string().min(0),
      language: languageIso.optional(),
    })
    .xor("toUserIds", "conversationId");

  schemas.translateMessagesBody = Joi.object().keys({
    messageIds: Joi.array().items(Joi.number().required()).required(),
    language: languageIso.required(),
  });

  //Profile
  schemas.setProfileBody = Joi.object().keys({
    bio: bio.optional().allow(null, ""),
    hometown: Joi.string().optional().allow(null, ""),
    isOnboarding: Joi.boolean().optional()
  });
  schemas.addPromptResponseBody = Joi.object().keys({
    // promptId: Joi.string().optional(),
    // prompt: Joi.string().optional(),
    // response: Joi.string().required()
    prompts: Joi.object().pattern(/./, Joi.string()),
  });
  // .or("promptId", "prompt");
  schemas.removePromptResponseBody = Joi.object().keys({
    promptId: Joi.string().required(),
  });
  schemas.setInterestsBody = Joi.object().keys({
    interests: Joi.array().items(interest).max(5).required(),
  });
  schemas.findProfilesQuery = Joi.object().keys({
    minAge: age.required(),
    maxAge: age.required(),
    maxDistance: Joi.number().required(), //miles
    maxResults: Joi.number().optional().max(50),
  });
  schemas.getImagesQuery = Joi.object().keys({
    ordinal: imageOrdinal.optional(),
  });
  schemas.deleteImageBody = Joi.object().keys({
    ordinal: imageOrdinal.required(),
  });
  schemas.updateImageMetaDataBody = Joi.object().pattern(
    Joi.string().uuid(), //key is UUID for image ID
    Joi.object().keys({ ordinal: imageOrdinal }) // value is a nested object with the values to set
  );

  //Relationship
  schemas.createRelationshipBody = Joi.object().keys({
    relationshipType: relationshipTypeName.required(),
  });
  schemas.createRelationshipParams = Joi.object().keys({
    patientUserId: dbId.required(),
  });
  schemas.getRelationshipsParams = Joi.object().keys({
    relationshipType: relationshipAggregateTypeName.required().insensitive(),
  });

  //Auth
  schemas.emailRegisterBody = Joi.object().keys({
    email: email.required(),
    password: password.required(),
    name: Joi.string().required(),
    dob: dob.required(),
    lastLon: longitude.optional(),
    lastLat: latitude.optional(),
    statusId: statusId.optional(),
    appleDeviceId: apnId.required(),
    mobile: phoneNumber.required(),
  });

  schemas.updateApiBody = Joi.object().keys({
    isApi: Joi.boolean().required()
  })
};

export const validateSchema = (value, schemaName) => {
  const res = schemas[schemaName].required().validate(value);
  if (res.error) {
    return {
      ok: false,
      reason: "bad-request",
      message: res.error.details.map((d) => d.message).join(),
    };
  }
  return { ok: true };
};

export default schemas;
