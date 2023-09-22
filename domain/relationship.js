import config from "../config/default.js";
import {
  getUserSwipeSubscriptionInfo,
  upsertRelationship,
  updateUserSwipeCache,
  getUserRelationshipAggregatesByType,
} from "../database/queries/relationship.js";
import { aggregateRelationshipType } from "../util/relationship.js";
import { sendNotification } from "./notify.js";
import { relationshipTypeIds } from "../database/constants.js";

export const createRelationship = async (
  agentUserId,
  relationshipTypeName,
  patientUserId
) => {
  if (agentUserId === patientUserId) {
    return {
      ok: false,
      reason: "bad-request",
      message: "Agent user and patient user cannot be the same.",
    };
  }

  //Check subscription and swipe limit
  let newWindowEnd, newRemainingSwipes, isInWindow;
  const userSubscriptionResult = await getUserSwipeSubscriptionInfo(
    agentUserId
  );
  const { subscriptionKind, windowEnd, remainingSwipes } =
    userSubscriptionResult;
  const swipeLimitConfig =
    config.subscriptionToggles.swipeLimit[subscriptionKind];
  const today = new Date();

  if (swipeLimitConfig) {
    isInWindow = windowEnd && today <= windowEnd;

    //If in window and no remaining swipes, return 400
    if (isInWindow && remainingSwipes < 1) {
      return {
        ok: false,
        reason: "bad-request",
        message: `You have no remaining swipes until ${windowEnd}`,
      };
    }
  }

  const relationshipTypeId = relationshipTypeIds[relationshipTypeName];

  //Create the relationship
  const result = await upsertRelationship(
    agentUserId,
    relationshipTypeName,
    patientUserId
  );

  //Check if there is a match
  const aggregateRelationshipTypeName = aggregateRelationshipType(
    result[0].upsertedUserRelationshipTypeName,
    result[0].reciprocalUserRelationshipTypeName,
    false
  );
  //Notify patient user of match
  if (aggregateRelationshipTypeName === "MATCH") {
    const notification = {
      type: "match",
      recipients: [{ id: patientUserId }],
      body: {
        message: "You have a new match!",
      },
    };

      sendNotification(notification);
  }

  //Update the swipe counter
  if (swipeLimitConfig) {
    newWindowEnd = isInWindow
      ? windowEnd
      : today.addHours(swipeLimitConfig.windowLength);
    newRemainingSwipes = isInWindow
      ? remainingSwipes - 1
      : swipeLimitConfig.numSwipes - 1;
    updateUserSwipeCache(
      agentUserId,
      newWindowEnd.toUTCString(),
      newRemainingSwipes
    ).then((res) => {
      if (!res.ok)
        console.log(`Error updating swipe cache for user ${agentUserId}`, res);
    });
  }

  return {
    ok: true,
    relationship: {
      relationshipType: aggregateRelationshipTypeName,
      remainingSwipes: newRemainingSwipes,
      windowEnd: newWindowEnd,
    },
  };
};

export const getRelationshipsByType = async (userId, relationshipType) => {
  const result = await getUserRelationshipAggregatesByType(
    userId,
    relationshipType
  );

  return { ok: true, relationships: result };
};
