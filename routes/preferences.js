import express from "express";
import {
  getPreferences,
  setGenderIdentity,
  setSexualities,
  setGendersInterested,
  setLanguages,
  setApi,
  getIsApi
} from "../controllers/preferences.js";
import { errorWrapper } from "./error.js";

const router = express.Router();

//Get preferences
router.get(
  "/all", //Ideally this would just be `/` but it conflicts with the router addition in app.js
  errorWrapper(async (req, res) => {
    const { status, body } = await getPreferences(req);
    res.status(status).send(body);
  })
);

//Gender identity
router.patch(
  "/gender-identity",
  errorWrapper(async (req, res) => {
    const { status, body } = await setGenderIdentity(req);
    res.status(status).send(body);
  })
);

//Genders - Interested
router.patch(
  "/genders-interested",
  errorWrapper(async (req, res) => {
    const { status, body } = await setGendersInterested(req);
    res.status(status).send(body);
  })
);

//Sexualities
router.patch(
  "/sexualities",
  errorWrapper(async (req, res) => {
    const { status, body } = await setSexualities(req);
    res.status(status).send(body);
  })
);

//Languages
router.patch(
  "/languages",
  errorWrapper(async (req, res) => {
    const { status, body } = await setLanguages(req);
    res.status(status).send(body);
  })
);

//Languages
router.patch(
  "/isApi",
  errorWrapper(async (req, res) => {
    const { status, body } = await setApi(req);
    res.status(status).send(body);
  })
);

//Get profile prompts
router.get(
  "/isApi",
  errorWrapper(async (req, res) => {
    const { status, body } = await getIsApi(req);
    res.status(status).send(body);
  })
);

export default router;
