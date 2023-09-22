import { getFailureBody } from "./controller-helper.js";

export const handleError = error => {
  let reason = "server-error",
    message = "An internal error occurred.";

  return getFailureBody({ reason, message });
};
