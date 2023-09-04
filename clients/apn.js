import apn from "apn";
import { secretsClient } from "./secrets-manager";
import fs from "fs";

export default class ApnClient {
  constructor(key, keyFilePath) {
    this.key = key;
    this.keyFilePath = keyFilePath;
    this.isProduction = false;

    this.provider = new apn.Provider({
      pfx: this.keyFilePath,
      production: this.isProduction
    });
  }

  static async saveKeyToP8File(key, filePath) {
    if (!fs.existsSync("./keys")) {
      fs.mkdirSync("./keys");
    }
    await fs.promises.writeFile(filePath, key);
    console.log(`Key saved to ${filePath}`);
  }

  static async build() {
    //Get key from AWS
    const secret = await secretsClient.get(`apn-key-${process.env.ENV}`);
    const key = secret.key;
    const keyFilePath = "./keys/apn-key.p8";

    //Save key to file
    await this.saveKeyToP8File(key, keyFilePath);

    return new this(key, keyFilePath);
  }

  send(apnId, notification) {
    const apnNotification = this.mapNotificationToApn(notification);
    return this.provider.send(apnNotification, apnId);
  }

  mapNotificationToApn(notification) {
    const apnNotification = new apn.Notification();
    if (notification.type === "message") {
      apnNotification.badge = 3;
      apnNotification.sound = "ping.aiff";
      apnNotification.alert = `New Message: ${notification.recipients.join()}`;
      apnNotification.payload = {
        messageFrom: notification.body.message.fromUserName,
        message: notification.body.message.message,
        sent: notification.body.message.sent
      };
      apnNotification.messageId = notification.body.message.id;
      apnNotification.conversationId = notification.body.conversation.id;
    }

    return apnNotification;
  }
}
