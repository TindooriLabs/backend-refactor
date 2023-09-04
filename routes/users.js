import express from "express";
import { errorWrapper } from "./error.js";
import { getOwnUser } from "../controllers/users.js";

var router = express.Router();

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.json({users: [{name: 'Timmy'}]});
// });

//Get user's own information
router.get(
  "/",
  errorWrapper(async (req, res) => {
    const { status, body } = await getOwnUser(req);

    res.status(status).json(body);
  })
);

export default router;
