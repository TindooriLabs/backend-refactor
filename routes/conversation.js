import express from "express";
import {
  createConversation,
  getConversation,
  sendMessage,
  translateMessages
} from "../controllers/conversation.js";
import { errorWrapper } from "./error.js";

const router = express.Router();

//Get conversation
router.get(
  "/:conversationId",
  errorWrapper(async (req, res) => {
    const { status, body } = await getConversation(req);

    res.status(status).json(body);
  })
);

//Send message
router.post(
  "/message",
  errorWrapper(async (req, res) => {
    const { status, body } = await sendMessage(req);
    res.status(status).send(body);
  })
);

//Get translated messages
router.post(
  "/message/translate",
  errorWrapper(async (req, res) => {
    const { status, body } = await translateMessages(req);
    res.status(status).send(body);
  })
);

router.post("/create",
errorWrapper(async (req, res) => {
  const { status, body } = await createConversation(req);
  res.status(status).send(body);
}))

export default router;
