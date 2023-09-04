import { v2 as TranslateClient } from "@google-cloud/translate";
import { featureToggle } from "../config/deps";

export default class Translator {
  constructor() {
    const { Translate } = TranslateClient;
    this.projectId = "tindoori";
    this.client = new Translate({
      projectId: this.projectId,
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });
  }

  async translate(text, originLanguage, targetLanguage) {
    //Don't translate to same language
    if (originLanguage === targetLanguage)
      return { ok: true, translation: text };

    const options = {
      from: originLanguage,
      to: targetLanguage
    };

    //Avoid hitting the Google API in non-Prod
    if (featureToggle("google-translate-override")) {
      return {
        ok: true,
        translation: `This is a mocked translation to avoid hitting the Google API in a non-production environment (${process.env.ENV}).`
      };
    }

    try {
      const response = await this.client.translate(text, options);
      return { ok: true, translation: response[0] };
    } catch (error) {
      console.log("Error calling Google Translate API.", error);
      return { ok: false, reason: "server-error", message: error.message };
    }
  }
}

export const translator = new Translator();
