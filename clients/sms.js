import twilio from "twilio";
import { secretsClient } from "./secrets-manager";
import config from "../config/default";
import { featureToggle } from "../config/deps";

export default class SMS {
  constructor(accountSid, authToken, twilioPhoneNumber) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.twilioPhoneNumber = twilioPhoneNumber;
    this.client = new twilio(accountSid, authToken);
  }

  static async build() {
    //Get key from AWS
    const secret = await secretsClient.get("twilio-key");
    const accountSid = secret["accountSid"];
    const authToken = secret["authToken"];
    const twilioPhoneNumber = secret["twilioPhoneNumber"];

    return new this(accountSid, authToken, twilioPhoneNumber);
  }

  async send(from, to, messageText) {
    try {
      const message = await this.client.messages.create({
        body: messageText,
        from,
        to
      });
      console.log(`Message sent with SID ${message.sid}.`);
      if (message.sid && !message.errorMessage) {
        return { ok: true, message };
      }
      return {
        ok: false,
        reason: "server-error",
        message: "Error sending SMS message: " + message.errorMessage
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        reason: "server-error",
        message: "Error sending SMS message: " + error.message
      };
    }
  }

  sendOTP(to, code) {
    if (featureToggle("sms-otp-override")) {
      return { ok: true };
    }
    const message = `Your Tindoori one-time authentication code is: ${code}.

This code will expire in ${config.mobile.verificationCodeExpiration} minutes.`;
    return this.send(this.twilioPhoneNumber, to, message);
  }
}

export const sms = SMS.build().then();
