import SMS from "../clients/sms.js";
// import ApnClient from "../clients/apn";
import { connectPostgres } from "../database/postgres.js";
// import { getConstants } from "../database/constants.js";
// import { connectMongo } from "../database/mongo/mongo";
// import { setSchemas } from "../util/schemas";
import addDateFunctions from "../util/datetime.js";
//import app from "../app";

const buildDeps = async app => {
  //Build config
  //Temp - force testing toggles to true while feature toggle server is down until infra changes are merged in
  const tempToggles = {
    "sms-otp-override": true,
    "google-translate-override": true
  };
  app.set("featureToggles", tempToggles);
  //await buildUnleashClient(app, env);

  //Modify date object with additional functions
  addDateFunctions();

  //Build Twilio SMS client
  const smsClient = await SMS.build();
  app.set("smsClient", smsClient);

  //Build AWS Secrets Manager
//   const apnClient = await ApnClient.build();
//   app.set("apnClient", apnClient);

  //Postgres
  await connectPostgres();

  //Mongo
//   await connectMongo();

  //The below functions depend on the Mongo and Postgres connections
  //DB constants
//   await getConstants();

  //Schemas
//   await setSchemas();
};

export const featureToggle = toggleName => {
  //const toggles = app.get("featureToggles");

  //Temp for testing quick fix - override toggles for testing
  const toggles = {
    "sms-otp-override": true,
    "google-translate-override": true
  };

  return toggles?.[toggleName];
};

export default buildDeps;
