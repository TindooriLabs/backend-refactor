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
    console.log(
      `Error emitting '${notification.type}' notification.`,
      error,
      notification.recipients
    );
  }
};
