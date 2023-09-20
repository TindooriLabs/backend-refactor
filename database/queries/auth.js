import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt";
import config from "../../config/default.js";

export const addUserAndProfile = async (userDetails) => {
  const profileCreate = await prisma.profile.create({
    data: {
      user: {
        create: {},
      },
      firstName: userDetails.name || "",
      birthDate: new Date(userDetails.dob) || null,
      latitude: userDetails.lastLat,
      longitude: userDetails.lastLong,
    },
  });

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

  return profileCreate;
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
  const registrationAttemptCreate = await prisma.registrationAttempt.create({
    data: {
      email: userDetails.email,
      mobile: userDetails.mobile,
      passwordHash,
      firstName: userDetails.name,
      birthDate: new Date(userDetails.dob) || null,
      deviceKind: userDetails.appleDeviceId ? "IOS" : "ANDROID",
      deviceIdentifier: userDetails.appleDeviceId || "",
      verificationCodeHash: codeHash,
      attemptMadeAt: new Date(),
    },
  });
  const accountCreate = await prisma.account.create({
    data: {
      userId: userDetails.userId.toString(),
      email: userDetails.email,
      passwordHash,
      mobile: userDetails.mobile,
      verificationExpiration: userDetails.verificationExpiration,
    },
  });
  const addDeviceResult = await prisma.deviceRecord.create({
    data: {
      userId: userDetails.userId.toString(),
      kind: userDetails.appleDeviceId ? "IOS" : "ANDROID",
      identifier: userDetails.appleDeviceId || "",
    },
  });
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
  return accountCreate;
};

export const getUserByEmail = async (email, includePassword = false) => {
  const result = await prisma.account.findFirst({
    where: { email },
    select: {
      userId: true,
      email: true,
      mobile: true,
      passwordHash: includePassword,
    },
  });
  return result;
};

export const addDevice = async (userId, device) => {
  const addDeviceResult = await prisma.deviceRecord.create({
    data: {
      userId: userId.toString(),
      kind: device.kind ? "IOS" : "ANDROID",
      identifier: device.id || "",
    },
  });
  const deviceId = addDeviceResult?.id;
  if (deviceId) {
    const updateUserMetadataResult = await prisma.userMetadata.update({
      where: { userId: userId.toString() },
      data: {
        devices: {
          connect: {
            id: deviceId,
          },
        },
      },
    });
  }
  return { ok: true };
};

export const getUserVerificationInfo = async (userId, mobile) => {
  const userAccount = await prisma.account.findFirst({
    where: {
      userId: userId.toString(),
    },
    select: {
      verified: true,
      verificationExpiration: true,
    },
  });
  if (!userAccount) {
    return {
      ok: false,
      reason: "not-found",
      message: "User account not found",
    };
  }
  const userVerificationCode = await prisma.registrationAttempt.findFirst({
    where: {
      mobile,
    },
    orderBy: {
      attemptMadeAt: "desc",
    },
    select: {
      verificationCodeHash: true,
      attemptMadeAt: true,
      id: true,
    },
    take: 1,
  });
  let codeVerifier;
  if (
    userVerificationCode &&
    userVerificationCode.verificationCodeHash?.length > 0
  ) {
    codeVerifier = (code) =>
      bcrypt.compare(code, userVerificationCode.verificationCodeHash);
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

export const setUserVerified = async (userId, mobile) => {
  let account;
  try {
    await prisma.$transaction([
      prisma.registrationAttempt.update({
        where: {
          mobile: mobile.toString(),
        },
        data: {
          verificationCodeHash: "",
        },
      }),
      prisma.account.update({
        where: {
          userId: userId.toString(),
        },
        data: {
          verified: true,
          verificationExpiration: null,
        },
      }),
    ]);
    account = await prisma.account.findFirst({
      where: {
        userId: userId.toString(),
      },
    });
  } catch (e) {
   
    return {
      ok: false,
      reason: "not found",
      message: "User not found in the SQL database",
    };
  }
 
  return { ok: true, account };
};
