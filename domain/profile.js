import {
  createOrUpdateProfile,
  getProfilePrompts,
  createOrUpdatePrompt,
  deletePromptResponse,
  insertInterests,
  getInterests,
  updateInterests,
  getUserSubscriptionInfo,
  findUsers,
  getImagesMetaByUserId,
  insertImageData,
  deleteImageData,
  updateImageData
} from "../database/queries/profile.js";
import config from "../config/default.js";
import { v4 as uuid } from "uuid";
import { s3 } from "../database/s3-client.js";
import { compress } from "../util/file.js";

export const setProfile = async (userId, profile) => {
  try {
    const result = await createOrUpdateProfile(userId, profile);
  } catch (e) {
   
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user profile in the SQL database.",
    };
  }

  return { ok: true };
};

export const getPrompts = async (userId) => {
  let prompts = await getProfilePrompts(userId);
  prompts = prompts.map((prompt) => {
    return {
      userId: prompt.userId,
      questionId: prompt.question.id.toString(),
      response: prompt.response,
    };
  });
  return { ok: true, prompts };
};

export const addPromptResponse = async (userId, promptId, prompt, response) => {
  let result;
  try {
    result = await createOrUpdatePrompt(userId, promptId, prompt, response);
  } catch (e) {
    return {
      ok: false,
      reason: "not-found",
      message: "Could not find the user in the SQL database.",
    };
  }

  return result;
};

export const removePromptResponse = async (userId, promptId) => {
  const result = await deletePromptResponse(userId, promptId);
  return result;
};

export const addInterests = async (userId, interests) => {
  interests = interests.map((interest) => interest.trim().toLowerCase());
  let interestsUnique = [...new Set(interests)];
  let existingInterests = await getInterests(userId);
  if (existingInterests && existingInterests.interests) {
    interestsUnique = interestsUnique.filter(
      (interest) => !existingInterests.interests.includes(interest)
    );
  }
  const result = await insertInterests(userId, interestsUnique);

  return result;
};

export const removeInterests = async (userId, interests) => {
  interests = interests.map((interest) => interest.trim().toLowerCase());
  let interestsUnique = [...new Set(interests)];
  let existingInterests = await getInterests(userId);
  let finalInterests = [];
  if (existingInterests && existingInterests.interests) {
    finalInterests = existingInterests.interests.filter(
      (interest) => !interestsUnique.includes(interest)
    );
  }
  const result = await updateInterests(userId, finalInterests);

  return result;
};

export const findProfiles = async (
  userId,
  minAge,
  maxAge,
  maxResults = 10,
  maxDistance
) => {
  //Determine if user's subscription level allows them to see if user has liked them
  const userSubscriptionResult = await getUserSubscriptionInfo(userId);

  const { subscriptionKind } = userSubscriptionResult;
  const showRelationshipInfo =
    config.subscriptionToggles.previewRelationshipType.includes(
      subscriptionKind
    );

  const sqlResult = await findUsers(
    userId,
    minAge,
    maxAge,
    maxResults,
    maxDistance,
    showRelationshipInfo
  );

  return { ok: true, users: sqlResult };
};

export const addImageToProfile = async (userId, fileBuffer, fileMeta) => {
  const uniqueId = uuid();
  const fileName = `user-${userId}/${uniqueId}.${fileMeta.extension}`;

  //Check number of images
  const currentImageResult = await getImagesMetaByUserId(userId);
  if (currentImageResult.length >= config.images.maxProfileImages) {
    return {
      ok: false,
      reason: "bad-request",
      message: `You have uploaded ${currentImageResult.imagesMeta.length} of the maximum ${config.images.maxProfileImages} images.`,
    };
  }
  //Compress the incoming file
  const compressionResult = await compress(fileBuffer);

  //Upload to s3
  // const uploadResult = await s3.uploadImage(fileName, compressionResult);
  // if (!uploadResult.ok) return uploadResult;

  //Save metadata to Mongo
  // const { key: s3Dir } = uploadResult;
  // fileMeta.s3Dir = s3Dir;
  fileMeta.s3Path = "user-1/4e4f61af-a0aa-4cb8-8c00-62b1aa7fe0a8.jpeg";
  fileMeta.id = uniqueId;
  delete fileMeta["originalName"];
  fileMeta.uploaded = new Date();

  const addImageResult = await insertImageData(userId, fileMeta);

  return { ok: true, data: { id: uniqueId, name: fileName } };
};

export const deleteImage = async (userId, ordinal) => {
  //Delete image metadata from database
  const deletedImage = await deleteImageData(userId, ordinal);

  //Delete data from S3
  //   if (deletedImage && deletedImage.s3Path) {
  //   const s3Result = await s3.deleteImage(deletedImage.s3Path);
  //   if (!s3Result.ok) {
  //     console.log(
  //       `Unable to delete object from S3 after it was removed from database. Object key: ${deletedImage.s3Path}`
  //     );
  //   }
  // }

  return { ok: true };
};

export const getImagesByUserId = async (userId, ordinal) => {
  const userImages = await getImagesMetaByUserId(userId, ordinal);
  //Get data from S3
  try {
    const images = await Promise.all(
      userImages.map(async (imageMeta) => {
        return s3.getImageWithData(imageMeta);
      })
    );
    return { ok: true, images };
  } catch (error) {
    
    return {
      ok: false,
      reason: "server-error",
      message: "Error getting image data from S3.",
    };
  }
};

export const updateImageMetaData = async (userId, imageMetaData) => {
  const userImages = await getImagesMetaByUserId(userId);
  const updatedUserImages = userImages.map((image) => {
    const newOrdinal = imageMetaData[image.id]?.ordinal;
    return { ...image, ordinal: newOrdinal || image.ordinal };
  });

  const updateResult = await updateImageData(userId, updatedUserImages);
  
  return updateResult;
};
