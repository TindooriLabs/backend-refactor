import { getFailureBody } from "./controller-helper.js";
import {
  getUser as getUserDomain,
  setStatus as setStatusDomain,
  setSubscription as setSubscriptionDomain,
  setLocation as setLocationDomain,
  setEthnicity as setEthnicityDomain,
  setDob as setDobDomain,
  setKarmaResponses as setKarmaResponsesBody,
  getSubscription as getSubscriptionDomain,
} from "../domain/users.js";
import { validateSchema } from "../util/schemas.js";
export const getOwnUser = async (req) => {
  const { userId } = req.user;

  const result = await getUserDomain(userId);

  //Return success
  if (result.ok) {
    return { status: 200, body: result.user };
  }

  return getFailureBody(result);
};

export const getUser = async (req) => {
  //Validate body
  const validation = validateSchema(req.params, "getUserParams");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { userId: requestingUserId } = req.user;

  const { userId } = req.params;

  const result = await getUserDomain(userId, requestingUserId);

  //Return success
  if (result.ok) {
    return { status: 200, body: result.user };
  }

  return getFailureBody(result);
};

export const setStatus = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setStatusBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { status: statusLabel } = req.body;
  const { userId } = req.user;

  const result = await setStatusDomain(userId, statusLabel);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const setSubscription = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setSubscriptionBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { subscriptionTierId } = req.body;
  const { userId } = req.user;

  const result = await setSubscriptionDomain(userId, subscriptionTierId);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const getSubscription = async (req) => {
  const { userId } = req.user;
  const result = await getSubscriptionDomain(userId);

  //Return success
  if (result.ok) {
    return { status: 200, body: result.result };
  }

  return getFailureBody(result);
};

export const setLocation = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setLocationBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { lat, lon } = req.body;
  const { userId } = req.user;

  const result = await setLocationDomain(userId, lat, lon);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const setEthnicity = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setEthnicityBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { ethnicityId } = req.body;
  const { userId } = req.user;

  const result = await setEthnicityDomain(userId, ethnicityId);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const setDob = async (req) => {
  //Validate body
  // const validation = validateSchema(req.body, "setDobBody");
  // if (!validation.ok) {
  //   return getFailureBody(validation);
  // }
  const { dob } = req.body;
  const { userId } = req.user;

  const result = await setDobDomain(userId, dob);

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};

export const setKarmaResponses = async (req) => {
  //Validate body
  const validation = validateSchema(req.body, "setKarmaResponsesBody");
  if (!validation.ok) {
    return getFailureBody(validation);
  }
  const { karmaResponses } = req.body;
  const { userId } = req.params;
  const { userId: ratingUserId } = req.user;

  const result = await setKarmaResponsesBody(
    userId,
    ratingUserId,
    karmaResponses
  );

  //Return success
  if (result.ok) {
    return { status: 204 };
  }

  return getFailureBody(result);
};
