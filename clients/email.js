import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export default class EmailClient {
  constructor() {
    this.config = {
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
    this.client = new SESClient(this.config);
  }

  async sendEmail(recipient, otp) {
    const params = {
      Source: "project.tindoori@gmail.com",
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Subject: {
          Data: "Tindoori Verification Email: No Reply",
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: `The OTP for email verification is: ${otp}. Please use this in the Tindoori app to verify the email address linked to your account.`,
            Charset: "UTF-8",
          },
        },
      },
    };
    const command = new SendEmailCommand(params);
    try {
      const response = await this.client.send(command);
      return { ok: true, response };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        reason: "server-error",
        message: "Error sending verification email: " + error.message,
      };
    }
  }
}

export const emailClient = new EmailClient();
