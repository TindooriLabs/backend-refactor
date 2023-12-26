import {
  setProfile as setProfileDomain,
  addPromptResponse as addPromptResponseDomain,
  removePromptResponse as removePromptResponseDomain,
  addInterests as addInterestsDomain,
  removeInterests as removeInterestsDomain,
  findProfiles as findProfilesDomain,
  addImageToProfile,
  deleteImage as deleteImageDomain,
  getImagesByUserId as getImagesByUserIdDomain,
  updateImageMetaData as updateImageMetaDataDomain,
  getPrompts as getPromptsDomain,
} from "../domain/profile.js";
import { getFailureBody, getResponseBody } from "./controller-helper.js";
import { validateSchema } from "../util/schemas.js";
import { sendNotification } from "../domain/notify.js";

export const setProfile = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setProfileBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { isOnboarding } = req.body;

  delete req.body["isOnboarding"];
  const result = await setProfileDomain(userId, req.body);

  //Return success
  if (result.ok) {
    if (isOnboarding) {
      const notification = {
        type: "welcome",
        recipients: [userId],
        subtitle: "Woohoo!",
        text: "Welcome to Tindoori! We're excited to have you on board.",
      };
      await sendNotification(notification);
    }
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const getPrompts = async (req) => {
  const { userId } = req.user;

  const result = await getPromptsDomain(userId);

  //Return success
  if (result.ok) {
    if (!result.prompts?.length) {
      return { status: 204 };
    }
    return { status: 200, body: result.prompts };
  }

  return getFailureBody(result);
};

export const addPromptResponse = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "addPromptResponseBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { prompts } = req.body;
  const result = await addPromptResponseDomain(userId, prompts);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const removePromptResponse = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "removePromptResponseBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { promptId } = req.body;

  const result = await removePromptResponseDomain(userId, parseInt(promptId));

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const addInterests = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setInterestsBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { interests } = req.body;

  const result = await addInterestsDomain(userId, interests);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const removeInterests = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setInterestsBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { interests } = req.body;

  const result = await removeInterestsDomain(userId, interests);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const findProfiles = async (req) => {
  //Validate body
  const validation = validateSchema(req.query, "findProfilesQuery");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId } = req.user;

  const { minAge, maxAge, maxDistance, maxResults } = req.query;

  const result = await findProfilesDomain(
    userId,
    minAge,
    maxAge,
    maxResults,
    maxDistance
  );

  //Return success
  if (result.ok) {
    if (result.users.length) return { status: 200, body: result.users };
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const uploadImage = async (req) => {
  const { file, fileValidationError } = req;

  if (!file) {
    return getFailureBody({
      ok: false,
      reason: "bad-request",
      message: "File not found.",
    });
  }

  const { originalname: originalName } = file;

  //Check file validation error (set from file middleware)
  if (fileValidationError) {
    return getFailureBody(fileValidationError);
  }

  const { userId } = req.user;

  const regexPattern = /^(\d+)-(.+)\.(\w+)$/; // ordinal-filename.ext
  const match = originalName.match(regexPattern);
  if (!match) {
    return getFailureBody({
      reason: "bad-request",
      message: "File name must match: <ordinal>-<filename>.<ext>",
    });
  }

  const ordinal = parseInt(match[1]);
  const imageName = match[2];
  const extension = match[3];
  const fileMeta = {
    ordinal,
    originalName: `${imageName}.${extension}`,
    extension,
    nameWithoutExtension: `${ordinal}-${imageName}`,
  };

  const uploadResult = await addImageToProfile(userId, file.buffer, fileMeta);
  if (!uploadResult.ok) return getFailureBody(uploadResult);

  return {
    status: 200,
    body: uploadResult.data,
  };
};

export const deleteImage = async (req) => {
  //Validate params
  const validation = validateSchema(req.body, "deleteImageBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }

  const { userId } = req.user;

  const { ordinal } = req.body;

  const result = await deleteImageDomain(userId, ordinal);

  return getResponseBody(result, "images");
};

export const getImagesByUserId = async (req) => {
  //Validate query
  const validation = validateSchema(req.query, "getImagesQuery");
  if (!validation.ok) {
    return getFailureBody(validation);
  }

  const { userId } = req.params;
  let ordinal = null;
  if (req.query.hasOwnProperty("ordinal")) {
    ordinal = req.query.ordinal;
  }

  const result = await getImagesByUserIdDomain(userId, ordinal);

  return getResponseBody(result, "images");
};

export const updateImageMetaData = async (req) => {
  //Validate body
  const validation = validateSchema(req.params, "updateImageMetaDataBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }

  const { userId } = req.user;

  const imageMetaData = req.body;

  const result = await updateImageMetaDataDomain(userId, imageMetaData);

  return getResponseBody(result, "images");
};
