import {
  SecretsManagerClient,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";

export default class SecretsClient {
  constructor() {
    this.config = {
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
    this.client = new SecretsManagerClient(this.config);
  }

  async get(secretName) {
    const command = new GetSecretValueCommand({
      SecretId: secretName
    });
    let response;

    try {
      response = await this.client.send(command);
    } catch (error) {
      console.log(`Error getting secret value for ${secretName}.`, error);
      throw error;
    }

    return JSON.parse(response.SecretString);
  }
}

export const secretsClient = new SecretsClient();
