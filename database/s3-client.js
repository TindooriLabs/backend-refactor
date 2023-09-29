import AWS from "aws-sdk";

export default class S3 {
  constructor() {
    this.client = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    this.imageBucket = process.env.AWS_IMAGES_BUCKET;
  }

  async addObject(bucket, name, fileBuffer, contentType) {
    const params = {
      Bucket: bucket,
      Key: name,
      Body: fileBuffer, // image in buffer format
      ContentType: contentType
    };

    let uploadResult;
    try {
      uploadResult = await this.client.upload(params).promise();
    } catch (error) {
      return {
        ok: false,
        reason: "server-error",
        message: `Error saving object to S3: ${error.message}.`
      };
    }

    return {
      ok: true,
      key: uploadResult.Key
    };
  }

  uploadImage(name, fileBuffer) {
    return this.addObject(this.imageBucket, name, fileBuffer, "image/jpeg");
  }

  async getObject(bucketName, key) {
    const params = {
      Bucket: bucketName,
      Key: key
    };

    try {
      const getResult = await this.client.getObject(params).promise();
      return { ok: true, body: getResult.Body };
    } catch (error) {
      return {
        ok: false,
        reason: "server-error",
        message: `Error getting object from S3: ${error.message}.`
      };
    }
  }

  getImage(fileKey) {
    return this.getObject(this.imageBucket, fileKey);
  }

  async getImageWithData(imageMeta) {
    const { s3Path } = imageMeta;

    const dataResponse = await this.getImage(s3Path);
    
    if (dataResponse.ok) return { ...imageMeta, buffer: dataResponse.body };
    return { ...imageMeta };
  }

  async deleteObject(bucketName, fileKey) {
    const params = { Bucket: bucketName, Key: fileKey };
    try {
      await this.client.deleteObject(params).promise();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason: "server-error",
        message: "Error deleting object from S3."
      };
    }
  }

  deleteImage(fileKey) {
    return this.deleteObject(this.imageBucket, fileKey);
  }
}

export const s3 = new S3();
