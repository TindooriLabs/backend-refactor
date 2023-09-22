

let schemas = {};

// export const setSchemas = async () => {
//   //Components
//   const dbId = Joi.number();
//   const dbIdArray = Joi.array().items(dbId);
//   const mongoId = Joi.objectId();
//   const email = Joi.string().email();
//   const password = Joi.string();
//   const dob = Joi.date();
//   const age = Joi.number();
//   const latLon = Joi.number();
//   const pageLength = Joi.number().positive();
//   const page = Joi.number().positive();
//   const imageOrdinal = Joi.number();
//   const phoneNumber = Joi.string().min(10).max(15);
//   const verificationCode = Joi.string().length(6);
//   const statusName = Joi.string().valid(
//     ...Object.keys(dbConstants.userStatusIds)
//   );
//   const statusId = Joi.number().valid(
//     ...Object.values(dbConstants.userStatusIds)
//   );
//   const ethnicityId = Joi.number().valid(
//     ...Object.values(dbConstants.ethnicityIds)
//   );
//   const relationshipTypeName = Joi.string().valid(
//     ...Object.keys(dbConstants.relationshipTypeIds)
//   );
//   const relationshipAggregateTypeName = Joi.string().valid(
//     ...Object.keys(dbConstants.relationshipAggregateTypeIds)
//   );
//   const sexualityId = Joi.string().valid(
//     ...Object.values(dbConstants.sexualityIds)
//   );
//   const genderIdentityId = Joi.string().valid(
//     ...Object.values(dbConstants.genderIdentityIds)
//   );
//   const languageLevelId = Joi.string().valid(
//     ...Object.values(dbConstants.languageLevelIds)
//   );
//   const subscriptionTierId = Joi.valid(
//     ...Object.values(dbConstants.subscriptionTiers)
//   );
//   const languageIso = Joi.string().valid(...ISO.getAllCodes());
//   const userLanguage = Joi.object().keys({
//     languageId: languageIso,
//     languageLevelId
//   });
//   const karmaResponses = Joi.object().keys({
//     questionId: Joi.number(),
//     rating: Joi.number().min(1).max(5)
//   });
//   const bio = Joi.string().max(500);
//   const interest = Joi.string().max(100);

//   //Notifications
//   const apnId = Joi.string(); //Apple Push Notification device ID

//   //User
//   schemas.getUserParams = Joi.object().keys({
//     userId: dbId.required()
//   });
//   schemas.setStatusBody = Joi.object().keys({
//     status: statusName.required()
//   });
//   schemas.verifyMobileBody = Joi.object().keys({
//     code: verificationCode.required()
//   });
//   schemas.setSubscriptionBody = Joi.object().keys({
//     subscriptionTierId: subscriptionTierId.required()
//   });
//   schemas.statusId = statusId.required();
//   schemas.setLocationBody = Joi.object().keys({
//     lat: latLon.required(),
//     lon: latLon.required()
//   });
//   schemas.setEthnicityBody = Joi.object().keys({
//     ethnicityId: ethnicityId.required()
//   });
//   schemas.setGenderIdentityBody = Joi.object().keys({
//     genderIdentityId: genderIdentityId.required()
//   });
//   schemas.setGendersInterestedBody = Joi.object().keys({
//     genderIdentityIds: Joi.array().items(genderIdentityId).required()
//   });
//   schemas.setSexualitiesBody = Joi.object().keys({
//     sexualityIds: Joi.array().items(sexualityId).required()
//   });
//   schemas.setLanguagesBody = Joi.object().keys({
//     userLanguages: Joi.array().items(userLanguage).required()
//   });
//   schemas.setDobBody = Joi.object().keys({
//     dob: dob.required()
//   });
//   schemas.setKarmaResponsesBody = Joi.object().keys({
//     karmaResponses: Joi.array().items(karmaResponses).required()
//   });

//   //Conversation
//   schemas.getConversationParams = Joi.object().keys({
//     conversationId: mongoId
//   });
//   schemas.getUserConversationsParams = Joi.object().keys({
//     userId: dbId
//   });
//   schemas.getConversationQuery = Joi.object().keys({
//     pageLength: pageLength.optional(),
//     page: page.optional()
//   });
//   schemas.sendMessageBody = Joi.object()
//     .keys({
//       toUserIds: dbIdArray,
//       conversationId: mongoId,
//       message: Joi.string().required(),
//       language: languageIso.optional()
//     })
//     .xor("toUserIds", "conversationId");
//   schemas.sendMessageQuery = Joi.object().keys({
//     pageLength: pageLength.optional()
//   });
//   schemas.translateMessagesBody = Joi.object().keys({
//     messageIds: Joi.array().items(mongoId.required()).required(),
//     language: languageIso.required()
//   });

//   //Profile
//   schemas.setProfileBody = Joi.object().keys({
//     bio: bio.optional().allow(null, ""),
//     hometown: Joi.string().optional().allow(null, "")
//   });
//   schemas.addPromptResponseBody = Joi.object()
//     .keys({
//       promptId: mongoId.optional(),
//       prompt: Joi.string().optional(),
//       response: Joi.string().required()
//     })
//     .or("promptId", "prompt");
//   schemas.removePromptResponseBody = Joi.object().keys({
//     promptId: mongoId.required()
//   });
//   schemas.setInterestsBody = Joi.object().keys({
//     interests: Joi.array().items(interest).required()
//   });
//   schemas.findProfilesQuery = Joi.object().keys({
//     minAge: age.required(),
//     maxAge: age.required(),
//     maxDistance: Joi.number().required(), //miles
//     maxResults: Joi.number().optional().max(50)
//   });
//   schemas.getImagesQuery = Joi.object().keys({
//     ordinal: imageOrdinal.optional()
//   });
//   schemas.deleteImageBody = Joi.object().keys({
//     ordinal: imageOrdinal.required()
//   });
//   schemas.updateImageMetaDataBody = Joi.object().pattern(
//     Joi.string().guid(), //key is UUID for image ID
//     Joi.object().keys({ ordinal: imageOrdinal }) // value is a nested object with the values to set
//   );

//   //Relationship
//   schemas.createRelationshipBody = Joi.object().keys({
//     relationshipType: relationshipTypeName.required()
//   });
//   schemas.createRelationshipParams = Joi.object().keys({
//     patientUserId: dbId.required()
//   });
//   schemas.getRelationshipsParams = Joi.object().keys({
//     relationshipType: relationshipAggregateTypeName.required().insensitive()
//   });

//   //Auth
//   schemas.emailRegisterBody = Joi.object().keys({
//     email: email.required(),
//     password: password.required(),
//     name: Joi.string(),
//     dob: dob.required(),
//     lastLon: latLon,
//     lastLat: latLon,
//     statusId: statusId,
//     appleDeviceId: apnId.optional(),
//     mobile: phoneNumber.required()
//   });
// };

export const validateSchema = (value, schemaName) => {
//   const res = schemas[schemaName].required().validate(value);
//   if (res.error) {
//     return {
//       ok: false,
//       reason: "bad-request",
//       message: res.error.details.map(d => d.message).join()
//     };
//   }
  return { ok: true };
};

export default schemas;
