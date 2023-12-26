import axios from "axios";
import { featureToggle } from "../config/deps.js";

export const sendNotification = async (notification) => {
  if (featureToggle("notification-override")) {
    return;
  }
  let requestBody = {
    include_aliases: { external_id: notification.recipients },
    app_id: process.env.ONESIGNAL_APP_ID,
    target_channel: "push",
    name: notification.type,
    contents: {
      en: notification.text,
    },
    headings: {
      en: "Tindoori",
    },
  };
  if (notification.subtitle) {
    requestBody.subtitle = {
      en: notification.subtitle,
    };
  }
  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      requestBody,
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.log(`Error emitting '${notification.type}' notification.`);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Data => \n"+error.response.data);
      console.log("Status => \n"+error.response.status);
      console.log("Headers => \n"+error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log("Request => ");
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error => \n"+error.message);
    }
    console.log("Config => \n"+error.config);
  }
};
