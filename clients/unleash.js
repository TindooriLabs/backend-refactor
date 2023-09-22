//These are required for fetch in node versions prior to 18
require("es6-promise").polyfill();
require("isomorphic-fetch");

import { UnleashClient } from "unleash-proxy-client";
import { secretsClient } from "./secrets-manager";

export default async function buildUnleashClient(app, env) {
  //Get secrets
  const secrets = await secretsClient.get("unleash-feature-toggles");
  const { backend: tindooriApiKey } = await secretsClient.get(`apikeys-${env}`);

  const unleash = new UnleashClient({
    url: secrets.url,
    clientKey: secrets[`token-${process.env.ENV}`],
    appName: `tindoori-backend-${env}`,
    customHeaders: {
      "tindoori-apikey": tindooriApiKey
    }
  });

  unleash.on("ready", async () => {
    console.log("Unleash feature toggle client is ready!");
    const toggles = unleash.getAllToggles(); //this only turns toggles that are enabled
    const togglesHash = toggles.reduce((togglesHash, t) => {
      togglesHash[t.name] = t.enabled;
      return togglesHash;
    }, {});
    console.log("Enabled Feature Toggles: ", togglesHash);

    app.set("unleashClient", unleash);

    //Temp - force testing toggles to true while feature toggle server is down until infra changes are merged in
    const tempToggles = {
      "sms-otp-override": true,
      "google-translate-override": true
    };
    app.set("featureToggles", tempToggles);
    //app.set("featureToggles", togglesHash);
  });

  await unleash.start();
}
