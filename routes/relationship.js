import express from "express";
import {
  createRelationship,
  getUserRelationshipsByType
} from "../controllers/relationship.js";
import { errorWrapper } from "./error.js";

const router = express.Router();

//Create a user relationship
router.post(
  "/:patientUserId",
  errorWrapper(async (req, res) => {
    const { status, body } = await createRelationship(req);
    res.status(status).send(body);
  })
);

//Get user relationships of a certain type
router.get(
  "/:relationshipType",
  errorWrapper(async (req, res) => {
    const { status, body } = await getUserRelationshipsByType(req);
    res.status(status).send(body);
  })
);

export default router;
