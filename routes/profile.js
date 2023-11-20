import express from "express";
import {
  getPrompts,
  addPromptResponse,
  removePromptResponse,
  setProfile,
  addInterests,
  removeInterests,
  findProfiles,
  uploadImage,
  deleteImage,
  getImagesByUserId,
  updateImageMetaData
} from "../controllers/profile.js";
import { errorWrapper } from "./error.js";
import fileReqMiddleware from "../middleware/file.js";


const router = express.Router();

//Set user profile
router.patch(
  "/",
  errorWrapper(async (req, res) => {
    const { status, body } = await setProfile(req);
    res.status(status).send(body);
  })
);

//Get profile prompts
router.get(
  "/prompts",
  errorWrapper(async (req, res) => {
    const { status, body } = await getPrompts(req);
    res.status(status).send(body);
  })
);

//Add profile prompts and responses
router.put(
  "/prompts",
  errorWrapper(async (req, res) => {
    const { status, body } = await addPromptResponse(req);
    res.status(status).send(body);
  })
);

//Remove profile prompts and responses
router.delete(
  "/prompts",
  errorWrapper(async (req, res) => {
    const { status, body } = await removePromptResponse(req);
    res.status(status).send(body);
  })
);

//Set user profile interests
router.put(
  "/interests",
  errorWrapper(async (req, res) => {
    const { status, body } = await addInterests(req);
    res.status(status).send(body);
  })
);

//Set user profile interests
router.delete(
  "/interests",
  errorWrapper(async (req, res) => {
    const { status, body } = await removeInterests(req);
    res.status(status).send(body);
  })
);

//Get user profiles
router.get(
  "/find",
  errorWrapper(async (req, res) => {
    const { status, body } = await findProfiles(req);
    console.log(body)
    res.status(status).send(body);
  })
);

//Upload a profile image
router.put(
  "/image",
  fileReqMiddleware({ fileType: "image", bodyParamKey: "image" }),
  errorWrapper(async (req, res) => {
    const { status, body } = await uploadImage(req);
    res.status(status).send(body);
  })
);

//Delete a profile image
router.delete(
  "/image",
  errorWrapper(async (req, res) => {
    const { status, body } = await deleteImage(req);
    res.status(status).send(body);
  })
);

//Get profile images for user
router.get(
  "/images/:userId",
  errorWrapper(async (req, res) => {
    const { status, body } = await getImagesByUserId(req);
    res.status(status).send(body);
  })
);

//Update profile image order
router.patch(
  "/images",
  errorWrapper(async (req, res) => {
    const { status, body } = await updateImageMetaData(req);
    res.status(status).send(body);
  })
);

export default router;