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
CREATE TYPE "UserImpressionAggregateKind" AS ENUM ('INCOMPLETE', 'MATCH', 'NONMATCH', 'UNMATCH');

-- CreateEnum
CREATE TYPE "SubscriptionKind" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationExpiration" TIMESTAMPTZ(3),

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
    "uploaded" TIMESTAMPTZ(3) NOT NULL,

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
    "updated" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserImpressionBallot_pkey" PRIMARY KEY ("fromUserId","toUserId")
);

-- CreateTable
CREATE TABLE "UserImpressionArchive" (
    "id" SERIAL NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "impression" "UserImpressionKind" NOT NULL,
    "updated" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserImpressionArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sendTime" TIMESTAMPTZ(3) NOT NULL,
    "originalLanguageName" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

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
    "expiration" TIMESTAMPTZ(3) NOT NULL,

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
CREATE TABLE "UserSwipeCache" (
    "userId" TEXT NOT NULL,
    "windowEnd" TIMESTAMPTZ(3) NOT NULL,
    "remainingSwipes" INTEGER NOT NULL,

    CONSTRAINT "UserSwipeCache_pkey" PRIMARY KEY ("userId")
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
ALTER TABLE "UserImpressionArchive" ADD CONSTRAINT "UserImpressionArchive_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserImpressionArchive" ADD CONSTRAINT "UserImpressionArchive_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "UserSwipeCache" ADD CONSTRAINT "UserSwipeCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

--Karma Score Computation Procedure
CREATE OR REPLACE FUNCTION compute_karma_score() 
    RETURNS TRIGGER
AS $$
BEGIN
    INSERT INTO "KarmaScore"
    VALUES (NEW."toUserId", NEW."questionIndex", NEW.score, 1)
    ON CONFLICT ("userId", "questionIndex") DO
    UPDATE SET sum = "KarmaScore".sum + NEW.score, 
    count = "KarmaScore".count + 1;

    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

--Karma Score Update Procedure
CREATE OR REPLACE FUNCTION update_karma_score() 
    RETURNS TRIGGER
AS $$
BEGIN
    UPDATE "KarmaScore"
    SET sum = sum + (NEW.score - OLD.score)
    WHERE "userId" = NEW."toUserId" AND "questionIndex" = NEW."questionIndex";

    RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- Karma Score Trigger
CREATE TRIGGER karma_score_insert
AFTER INSERT
ON "KarmaBallot" 
FOR EACH ROW 
EXECUTE PROCEDURE compute_karma_score();

-- Karma Score Trigger
CREATE TRIGGER karma_score_update
AFTER UPDATE
ON "KarmaBallot" 
FOR EACH ROW 
EXECUTE PROCEDURE update_karma_score();

--User Relationships Archive Insert Procedure
create or replace function user_relationship_archive_fn()
  returns trigger as
$$
begin

    insert into "UserImpressionArchive" ( "fromUserId", "impression", "toUserId", "updated")
 	values(new."fromUserId", new."impression", new."toUserId", new.updated);

return new;
end;
$$
language PLPGSQL;

--User Relationships Archive Trigger
create trigger user_relationship_archive_trigger
  after insert
  on public."UserImpressionBallot"
  for each row
  execute procedure user_relationship_archive_fn();

--User Relationships Aggregate View Creation
create view UserImpressionAggregate as
	select *,
		case --Evaluates the two user relationships and returns an aggregate relationship ID
			--NonMatch (Skip)
			when uib.impression_1 = 'SKIP' or uib.impression_2 = 'SKIP' then 'NONMATCH'
			--UnMatch
			when uib.impression_1 = 'UNMATCH' or uib.impression_2 = 'UNMATCH' then 'UNMATCH'
			--Incomplete (One-way like, uib -> uib2)
			when uib.impression_1 = 'LIKE' and uib.impression_2 is null then 'INCOMPLETE'
			--Incomplete (One-way like, uib2 -> uib)
			when uib.impression_2 = 'LIKE' and uib.impression_1 is null then 'INCOMPLETE'
			--Match
			when uib.impression_1 = 'LIKE' and uib.impression_2 = 'LIKE' then 'MATCH'
			else null end 
			as "userImpressionAggregateType"
	from (
		select distinct 
		case when uib."fromUserId" > uib."toUserId" then uib."fromUserId" else uib."toUserId" end as "userId_A",
		case when uib."fromUserId" < uib."toUserId" then uib."fromUserId" else uib."toUserId" end as "userId_B",
		uib.impression impression_1, 
		uib2.impression impression_2 
		from "UserImpressionBallot" uib
		--Reciprocal relationship
		left join "UserImpressionBallot" uib2 on 
			uib."toUserId" = uib2."fromUserId" and 
			uib."fromUserId" = uib2."toUserId") uib;

create extension if not exists cube;
create extension if not exists earthdistance;