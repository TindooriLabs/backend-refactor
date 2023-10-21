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
  updateImageData,
  deleteAllUserPrompts,
} from "../database/queries/profile.js";
import config from "../config/default.js";
import { v4 as uuid } from "uuid";
import { s3 } from "../database/s3-client.js";
import { compress } from "../util/file.js";
import {
  ethnicityIds,
  genderIdentityIds,
  languageIds,
  languageLevelIds,
  relationshipTypeIds,
  sexualityIds,
  userRelationshipAggregateTypeIds,
} from "../database/constants.js";

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
      id: prompt.question.text,
      text: prompt.response,
    };
  });
  return { ok: true, prompts };
};

export const addPromptResponse = async (userId, prompts) => {
  let result, deleteResult;
  try {
    deleteResult = await deleteAllUserPrompts(userId);
    if (deleteResult.ok) {
      result = await createOrUpdatePrompt(userId, prompts);
    }
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

  const result = await updateInterests(userId, interestsUnique);

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

  let sqlResult = await findUsers(
    userId,
    minAge,
    maxAge,
    maxResults,
    maxDistance,
    showRelationshipInfo
  );
  sqlResult = sqlResult.map((result) => {
    if (result.hasOwnProperty("ethnicity")) {
      if (result["ethnicity"]) {
        result["ethnicityId"] = ethnicityIds[result["ethnicity"]];
      } else {
        result["ethnicityId"] = null;
      }
      delete result["ethnicity"];
    }
    if (result.hasOwnProperty("genderIdentity")) {
      if (result["genderIdentity"]) {
        result["genderIdentityId"] =
          genderIdentityIds[result["genderIdentity"]];
      } else {
        result["genderIdentityId"] = null;
      }
      delete result["genderIdentity"];
    }
    if (result.hasOwnProperty("existingRelationshipType")) {
      if (result["existingRelationshipType"]) {
        result["existingRelationshipTypeId"] =
          relationshipTypeIds[result["existingRelationshipType"]];
      } else {
        result["existingRelationshipTypeId"] = null;
      }
      delete result["existingRelationshipType"];
    }
    if (result.hasOwnProperty("userRelationshipAggregateType")) {
      if (result["userRelationshipAggregateType"]) {
        result["userRelationshipAggregateTypeId"] =
          userRelationshipAggregateTypeIds[
            result["userRelationshipAggregateType"]
          ];
      } else {
        result["userRelationshipAggregateTypeId"] = null;
      }
      delete result["userRelationshipAggregateType"];
    }
    if (result.hasOwnProperty("languages")) {
      if (result["languages"]) {
        result["languages"] = result["languages"].map((lang) => {
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
        result["languages"] = [];
      }
    }

    if (result.hasOwnProperty("images")) {
      if (result["images"]) {
        result["images"] = result["images"].map((image) => {
          image["s3Dir"] = image["s3Path"] || "";
          image["originalName"] =
            `${image["nameWithoutExtension"]}.${image["extension"]}` || "";
          ["userId", "s3Path", "nameWithoutExtension", "extension"].map(
            (key) => delete image[key]
          );
          return image;
        });
      } else {
        result["images"] = [];
      }
    }
    return result;
  });

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
  const uploadResult = await s3.uploadImage(fileName, compressionResult);
  if (!uploadResult.ok) return uploadResult;

  //Save metadata to database
  const { key: s3Dir } = uploadResult;
  fileMeta.s3Path = s3Dir;
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
  if (deletedImage && deletedImage.s3Path) {
    const s3Result = await s3.deleteImage(deletedImage.s3Path);
    if (!s3Result.ok) {
      console.log(
        `Unable to delete object from S3 after it was removed from database. Object key: ${deletedImage.s3Path}`
      );
    }
  }

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
    const imagesFinal = images.map((image) => {
      image["s3Dir"] = image["s3Path"] || "";
      image["originalName"] =
        `${image["nameWithoutExtension"]}.${image["extension"]}` || "";
      ["userId", "s3Path", "nameWithoutExtension", "extension"].map(
        (key) => delete image[key]
      );
      return image;
    });
    return { ok: true, images: imagesFinal };
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
