import SMS from "../clients/sms.js";
import ApnClient from "../clients/apn.js";
import { connectPostgres } from "../database/postgres.js";
import { setSchemas } from "../util/schemas.js";
import addDateFunctions from "../util/datetime.js";
//import app from "../app";

const buildDeps = async app => {
  //Build config
  //Temp - force testing toggles to true while feature toggle server is down until infra changes are merged in
  const tempToggles = {
    "sms-otp-override": false,
    "google-translate-override": false
  };
  app.set("featureToggles", tempToggles);
  // await buildUnleashClient(app, env);

  //Modify date object with additional functions
  addDateFunctions();

  //Build Twilio SMS client
  const smsClient = await SMS.build();
  app.set("smsClient", smsClient);

  //Build AWS Secrets Manager
  const apnClient = await ApnClient.build();
  app.set("apnClient", apnClient);

  //Postgres
  await connectPostgres();

  //The below function depends on the Postgres connection

  //Schemas
  await setSchemas();
};

export const featureToggle = toggleName => {
  //const toggles = app.get("featureToggles");

  //Temp for testing quick fix - override toggles for testing
  const toggles = {
    "sms-otp-override": true,
    "google-translate-override": false
  };

  return toggles?.[toggleName];
};

export default buildDeps;
