import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import config from "../../config/default.js";
import { updateUserSwipeCache } from "./relationship.js";

export const addUserAndProfile = async (userDetails) => {
  let profileCreate;
  try {
    profileCreate = await prisma.profile.create({
      data: {
        user: {
          create: {},
        },
        firstName: userDetails.name || "",
        birthDate: new Date(userDetails.dob),
        latitude: userDetails.lastLat,
        longitude: userDetails.lastLon,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          ok: false,
          reason: "conflict",
          message: `${e.meta.target[0]} already exists!`,
        };
      }
    }
  }
  try {
    const userMetaDataCreate = await prisma.userMetadata.create({
      data: {
        user: {
          connect: {
            id: profileCreate.userId,
          },
        },
        creationTime: new Date(),
        accountStatus: userDetails.status,
        lastLogin: new Date(),
      },
    });
  } catch (e) {
    await deleteProfile(profileCreate.userId);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          ok: false,
          reason: "conflict",
          message: `${e.meta.target[0]} already exists!`,
        };
      }
    }
    
  }
  return { ok: true, profile: profileCreate };
};

export const registerUser = async (userDetails) => {
  const codeHash = await bcrypt.hash(
    userDetails.verificationCode,
    config.bcrypt.saltRounds
  );
  const passwordHash = await bcrypt.hash(
    userDetails.password,
    config.bcrypt.saltRounds
  );
  let accountCreate;
  try {
    accountCreate = await prisma.account.create({
      data: {
        userId: userDetails.userId.toString(),
        email: userDetails.email,
        passwordHash,
        mobile: userDetails.mobile,
        verificationExpiration: userDetails.verificationExpiration,
        deviceKind: userDetails.appleDeviceId ? "IOS" : "ANDROID",
        deviceIdentifier: userDetails.appleDeviceId || "",
        verificationCodeHash: codeHash,
        attemptMadeAt: new Date(),
      },
    });
  } catch (e) {
    await deleteUserMetadata(userDetails.userId);
    await deleteProfile(userDetails.userId);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          ok: false,
          reason: "conflict",
          message: `${e.meta.target[0]} already exists!`,
        };
      }
    }
   
  }
  try {
    const subsciptionCreate = await prisma.subscriptionEntry.create({
      data: {
        userId: userDetails.userId.toString(),
        subscriptionKind: "FREE",
      },
    });
  } catch (e) {
    await deleteAccount(userDetails.userId);
    await deleteUserMetadata(userDetails.userId);
    await deleteProfile(userDetails.userId);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          ok: false,
          reason: "conflict",
          message: `${e.meta.target[0]} already exists!`,
        };
      }
    
    }
  }
  const today = new Date();
  const userSwipeCacheCreate = await updateUserSwipeCache(
    userDetails.userId.toString(),
    today
      .addHours(config.subscriptionToggles.swipeLimit.FREE.windowLength)
      .toUTCString(),
    30
  );
  let addDeviceResult;
  try {
     addDeviceResult = await prisma.deviceRecord.create({
      data: {
        userId: userDetails.userId.toString(),
        kind: userDetails.appleDeviceId ? "IOS" : "ANDROID",
        identifier: userDetails.appleDeviceId || "",
      },
    });
  } catch (e) {
    await deleteSubscription(userDetails.userId);
    await deleteAccount(userDetails.userId);
    await deleteUserMetadata(userDetails.userId);
    await deleteProfile(userDetails.userId);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return {
          ok: false,
          reason: "conflict",
          message: `${e.meta.target[0]} already exists!`,
        };
      }
    
    }
  }
  const deviceId = addDeviceResult?.id;
  if (deviceId) {
    const updateUserMetadataResult = await prisma.userMetadata.update({
      where: { userId: userDetails.userId.toString() },
      data: {
        devices: {
          connect: {
            id: deviceId,
          },
        },
      },
    });
  }

  return { ok: true, account: accountCreate };
};

export const getUserByEmail = async (email, includePassword = false) => {
  const result = await prisma.account.findFirst({
    where: { email },
    select: {
      userId: true,
      email: true,
      mobile: true,
      passwordHash: includePassword,
      verified: true,
    },
  });
  return result;
};

export const getUserVerificationInfo = async (userId) => {
  const userAccount = await prisma.account.findFirst({
    where: {
      userId: userId.toString(),
    },
    select: {
      verified: true,
      verificationExpiration: true,
      verificationCodeHash: true,
    },
  });
  if (!userAccount) {
    return {
      ok: false,
      reason: "not-found",
      message: "User account not found",
    };
  }
  let codeVerifier;
  if (userAccount.verificationCodeHash?.length > 0) {
    codeVerifier = (code) =>
      bcrypt.compare(code, userAccount.verificationCodeHash);
  }
  return {
    ok: true,
    mobile: {
      verified: userAccount.verified,
      verificationExpiration: userAccount.verificationExpiration,
      codeVerifier,
    },
  };
};

export const setUserVerified = async (userId) => {
  let account;
  try {
    account = await prisma.account.update({
      where: {
        userId: userId.toString(),
      },
      data: {
        verified: true,
        verificationExpiration: null,
        verificationCodeHash: "",
      },
      select: {
        userId: true,
        email: true,
        mobile: true,
        passwordHash: true,
        verified: true,
      },
    });
  } catch (e) {
    return {
      ok: false,
      reason: "not found",
      message: "User account not found in the SQL database",
    };
  }

  return { ok: true, account };
};

export const getDeviceByUserId = async (userId, deviceId) => {
  const result = await prisma.deviceRecord.findFirst({
    where: {
      identifier: deviceId.toString(),
      userId: userId.toString(),
    },
  });
  return result;
};

export const getDevice = async (deviceId) => {
  const result = await prisma.deviceRecord.findFirst({
    where: {
      identifier: deviceId.toString(),
    },
  });
  return result;
};

const deleteProfile = async (userId) => {
  const result = await prisma.profile.delete({
    where: {
      userId,
    },
  });
};

const deleteSubscription = async (userId) => {
  const result = await prisma.subscriptionEntry.delete({
    where: {
      userId,
    },
  });
};

const deleteAccount = async (userId) => {
  const result = await prisma.account.delete({
    where: {
      userId,
    },
  });
};

const deleteUserMetadata = async (userId) => {
  const result = await prisma.userMetadata.delete({
    where: {
      userId,
    },
  });
};
