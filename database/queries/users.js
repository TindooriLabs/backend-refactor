import { pg as SQL } from "yesql";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



export const getUserInfo = async (id) => {
  const userInfo = await prisma.$queryRaw`select  pr."userId"::integer,
  pr."firstName" "name",
  pr."birthDate" "dob",
  pr."longitude" "lastLon",
  pr."latitude" "lastLat",
  um."accountStatus",
  pr."ethnicity",
  ROUND(km.sum::decimal/km.count, 2)::float8 "karmaScore",
  ac.email,
  ac.mobile,
  pr.hometown,
  pr.bio,
  iu."imageUploads" "images",
  pr.interests,
  prompt."promptResponses" "prompts"
from "Profile" pr
left join "UserMetadata" um ON pr."userId" = um."userId"
left join "KarmaScore" km ON pr."userId" = km."userId"
left join "Account" ac ON pr."userId" = ac."userId"
left join (
select "userId", json_agg(json_build_object(
'_id', iu.id, 'userId', iu."userId", 'ordinal', iu.ordinal, 
's3Path', iu."s3Path", 'nameWithoutExtension', iu."nameWithoutExtension", 
'extension', iu.extension)) "imageUploads" 
from "ImageUpload" iu 
group by "userId"
) iu on iu."userId" = pr."userId"
left join (
select "userId", json_agg(json_build_object(prompt."questionId", prompt.response)) "promptResponses"
from "PromptResponse" prompt
group by "userId"
) prompt on prompt."userId" = pr."userId"
where pr."userId" = ${id.toString()}`;
  return userInfo;
}

export const getRequestingUserInfo = async (id) => {
  const requestingUserInfo = await prisma.$queryRaw`select  pr."userId"::integer,
  pr."firstName" "name",
  pr."birthDate" "dob",
  pr."longitude" "lastLon",
  pr."latitude" "lastLat",
  um."accountStatus",
  pr."ethnicity",
  pr.bio,
  iu."imageUploads" "images",
  pr.interests,
  prompt."promptResponses" "prompts"
from "Profile" pr
left join "UserMetadata" um ON pr."userId" = um."userId"
left join (
select "userId", json_agg(json_build_object(
'_id', iu.id, 'userId', iu."userId", 'ordinal', iu.ordinal, 
's3Path', iu."s3Path", 'nameWithoutExtension', iu."nameWithoutExtension", 
'extension', iu.extension)) "imageUploads" 
from "ImageUpload" iu 
group by "userId"
) iu on iu."userId" = pr."userId"
left join (
select "userId", json_agg(json_build_object(prompt."questionId", prompt.response)) "promptResponses"
from "PromptResponse" prompt
group by "userId"
) prompt on prompt."userId" = pr."userId"
where pr."userId" = ${id.toString()}`;
  return requestingUserInfo;
}
// participants User[]
// messages     Message[]
export const getUserChatsWithLastMessage = async (id) => {
  const userChats = await prisma.chat.findMany({
    where:{participants:{
      some: {id: id.toString()}    } },
    include:{participants: true, messages: {
      orderBy:{
        sendTime: 'desc'
      },
      take: 1
    }}
  });

  return userChats;
}

export const getUserNames = async (ids) => {
const userNames = await prisma.profile.findMany({
  where: {
    userId:{
      in: ids
    }
  },
  select:{
    userId: true,
    firstName: true
  }
});

return userNames;
}

