-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "DeviceKind" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "Ethnicity" AS ENUM ('ASIAN', 'AFRICAN_AMERICAN', 'ALASKA_NATIVE', 'PACIFIC_ISLANDER', 'WHITE', 'LATIN_AMERICAN');

-- CreateEnum
CREATE TYPE "GenderIdentity" AS ENUM ('MAN', 'WOMAN', 'NONBINARY');

-- CreateEnum
CREATE TYPE "LanguageProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'FLUENT');

-- CreateEnum
CREATE TYPE "Sexuality" AS ENUM ('STRAIGHT', 'GAY', 'LESBIAN', 'BISEXUAL', 'PANSEXUAL', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "UserImpressionKind" AS ENUM ('LIKE', 'SKIP', 'UNMATCH');

-- CreateEnum
CREATE TYPE "SubscriptionKind" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DeviceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "DeviceKind" NOT NULL,
    "identifier" TEXT NOT NULL,

    CONSTRAINT "DeviceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMetadata" (
    "userId" TEXT NOT NULL,
    "creationTime" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMetadata_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "birthDate" DATE,
    "genderIdentity" "GenderIdentity",
    "sexuality" "Sexuality"[],
    "gendersOfInterest" "GenderIdentity"[],
    "ethnicity" "Ethnicity",
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "hometown" TEXT,
    "bio" TEXT NOT NULL DEFAULT '',
    "interests" TEXT[]
);

-- CreateTable
CREATE TABLE "PromptResponse" (
    "userId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "PromptResponse_pkey" PRIMARY KEY ("userId","questionId")
);

-- CreateTable
CREATE TABLE "PromptQuestion" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "PromptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "s3Path" TEXT NOT NULL,
    "nameWithoutExtension" TEXT NOT NULL,
    "extension" TEXT NOT NULL,

    CONSTRAINT "ImageUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguageAndLevel" (
    "userId" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "languageLevel" "LanguageProficiencyLevel" NOT NULL,
    "isLearning" BOOLEAN NOT NULL,

    CONSTRAINT "LanguageAndLevel_pkey" PRIMARY KEY ("userId","languageName")
);

-- CreateTable
CREATE TABLE "UserImpressionBallot" (
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "impression" "UserImpressionKind" NOT NULL,

    CONSTRAINT "UserImpressionBallot_pkey" PRIMARY KEY ("fromUserId","toUserId")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sendTime" TIMESTAMPTZ(3) NOT NULL,
    "originalLanguageName" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedTranslation" (
    "fromLanguageName" TEXT NOT NULL,
    "toLanguageName" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetText" TEXT NOT NULL,
    "lastUpdated" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "translatorName" TEXT NOT NULL,

    CONSTRAINT "CachedTranslation_pkey" PRIMARY KEY ("fromLanguageName","toLanguageName")
);

-- CreateTable
CREATE TABLE "KarmaBallot" (
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "KarmaBallot_pkey" PRIMARY KEY ("fromUserId","toUserId","questionIndex")
);

-- CreateTable
CREATE TABLE "KarmaScore" (
    "userId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "sum" BIGINT NOT NULL,
    "count" BIGINT NOT NULL,

    CONSTRAINT "KarmaScore_pkey" PRIMARY KEY ("userId","questionIndex")
);

-- CreateTable
CREATE TABLE "RegistrationAttempt" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "deviceKind" "DeviceKind" NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "verificationCodeHash" TEXT NOT NULL,
    "attemptMadeAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RegistrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEntry" (
    "userId" TEXT NOT NULL,
    "subscriptionKind" "SubscriptionKind" NOT NULL,

    CONSTRAINT "SubscriptionEntry_pkey" PRIMARY KEY ("userId","subscriptionKind")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChatToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_mobile_key" ON "Account"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageUpload_userId_ordinal_key" ON "ImageUpload"("userId", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationAttempt_mobile_key" ON "RegistrationAttempt"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatToUser_AB_unique" ON "_ChatToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatToUser_B_index" ON "_ChatToUser"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRecord" ADD CONSTRAINT "DeviceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserMetadata"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMetadata" ADD CONSTRAINT "UserMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptResponse" ADD CONSTRAINT "PromptResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptResponse" ADD CONSTRAINT "PromptResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PromptQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LanguageAndLevel" ADD CONSTRAINT "LanguageAndLevel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserImpressionBallot" ADD CONSTRAINT "UserImpressionBallot_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserImpressionBallot" ADD CONSTRAINT "UserImpressionBallot_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarmaBallot" ADD CONSTRAINT "KarmaBallot_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarmaBallot" ADD CONSTRAINT "KarmaBallot_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarmaScore" ADD CONSTRAINT "KarmaScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionEntry" ADD CONSTRAINT "SubscriptionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
