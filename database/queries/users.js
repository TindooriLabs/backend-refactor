import { pg as SQL } from "yesql";

const queries = {
    getUser: id =>
    SQL(`
    select  pr."userId"::integer,
            pr."firstName" "name",
            pr."birthDate" "dob",
            pr."longitude" "lastLon",
            pr."latitude" "lastLat",
            um."accountStatus",
            pr."ethnicity",
            se."subscriptionKind",
            ROUND(km.sum::decimal/km.count, 2)::float8 "karmaScore"
    from "Profile" pr
    left join "UserMetadata" um ON pr."userId" = um."userId"
    left join "SubscriptionEntry" se ON pr."userId" = se."userId"
    left join "KarmaScore" km ON pr."userId" = km."userId"
    where pr."userId" = :id
  `)({ id }),
  
    getUserWithPreferences: id =>
    SQL(`
    select  pr."userId"::integer,
      pr."firstName" "name",
      pr."birthDate" "dob",
      pr."longitude" "lastLon",
      pr."latitude" "lastLat",
      um."accountStatus",
      pr."ethnicity",
      se."subscriptionKind",
      ROUND(km.sum::decimal/km.count, 2)::float8 "karmaScore",
      pr."genderIdentity",
      ll."userLanguages",
      pr.sexuality "userSexualities",
      pr."gendersOfInterest" "userInterestedInGenderIdentities"
    from "Profile" pr
    left join "UserMetadata" um ON pr."userId" = um."userId"
    left join "SubscriptionEntry" se ON pr."userId" = se."userId"
    left join "KarmaScore" km ON pr."userId" = km."userId"
    left join (
    select  "userId", json_agg(json_build_object('languageName', ll."languageName", 'languageLevel', ll."languageLevel")) "userLanguages"
    from "LanguageAndLevel" ll 
    group by "userId"	
    ) ll on ll."userId" = pr."userId"
    where pr."userId" = :id
  `)({ id })
};

export default queries;