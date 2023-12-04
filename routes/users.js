import express from "express";
import { errorWrapper } from "./error.js";
import {
  getOwnUser,
  getUser,
  setStatus,
  setSubscription,
  setDob,
  setKarmaResponses,
  setLocation,
  setEthnicity,
  getSubscription,
  removeUser,
  validateReceipt
} from "../controllers/users.js";
import { getUserConversations } from "../controllers/conversation.js";

var router = express.Router();

//Get user's own information
router.get(
  "/",
  errorWrapper(async (req, res) => {
    const { status, body } = await getOwnUser(req);

    res.status(status).json(body);
  })
);

// Get user information
router.get(
  "/:userId",
  errorWrapper(async (req, res) => {
    const { status, body } = await getUser(req);

    res.status(status).json(body);
  })
);

router.get(
  "/:userId/conversations",
  errorWrapper(async (req, res) => {
    const { status, body } = await getUserConversations(req);

    res.status(status).json(body);
  })
);

//Update user status
router.patch(
  "/status",
  errorWrapper(async (req, res) => {
    const { status, body } = await setStatus(req);
    res.status(status).send(body);
  })
);

//Update user subscription level
router.patch(
  "/subscription",
  errorWrapper(async (req, res) => {
    const { status, body } = await setSubscription(req);
    res.status(status).send(body);
  })
);

router.get(
  "/subscription/data",
  errorWrapper(async (req, res) => {
    const { status, body } = await getSubscription(req);
    res.status(status).send(body);
  })
);

//Update user location
router.patch(
  "/location",
  errorWrapper(async (req, res) => {
    const { status, body } = await setLocation(req);
    res.status(status).send(body);
  })
);

//Update user ethnicity
router.patch(
  "/ethnicity",
  errorWrapper(async (req, res) => {
    const { status, body } = await setEthnicity(req);
    res.status(status).send(body);
  })
);

//Update user date of birth
router.patch(
  "/dob",
  errorWrapper(async (req, res) => {
    const { status, body } = await setDob(req);
    res.status(status).send(body);
  })
);

//Update user karma ratings
router.patch(
  "/:userId/karma",
  errorWrapper(async (req, res) => {
    const { status, body } = await setKarmaResponses(req);
    res.status(status).send(body);
  })
);

router.delete(
  "/",
  errorWrapper(async (req, res) => {
    const { status, body } = await removeUser(req);
    res.status(status).send(body);
  })
);

router.post(
  "/validate-subscription-receipt",
  errorWrapper(async function (req, res) {
    //Create the user
    const { status, body } = await validateReceipt(req);
    res.status(status).send(body);
  })
);

export default router;
