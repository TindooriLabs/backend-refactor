import express from "express";
import { errorWrapper } from "./error.js";
import { getOwnUser, getUser } from "../controllers/users.js";
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

export default router;
