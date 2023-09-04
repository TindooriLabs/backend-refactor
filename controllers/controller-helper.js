export const getStatusByReason = reason => {
    switch (reason) {
      case "success":
        return 200;
      case "no-content":
        return 204;
      case "partial-success":
        return 207;
      case "bad-request":
        return 400;
      case "unauthorized":
        return 401;
      case "forbidden":
        return 403;
      case "not-found":
        return 404;
      case "conflict":
        return 409;
      case "server-error":
      default:
        return 500;
    }
  };
  
  export const getFailureBody = response => {
    const status = getStatusByReason(response.reason);
    const body = {
      reason: response.reason,
      message: response.message
    };
  
    return { status, body };
  };
  
  export const getSuccessBody = (body, bodyKey) => {
    const bodyVal = body[bodyKey];
    let statusName;
    //Undefined, null, or empty array
    if (
      typeof bodyVal === "undefined" ||
      bodyVal === null ||
      (Array.isArray(bodyVal) && !bodyVal.length)
    ) {
      statusName = "no-content";
    } else {
      statusName = "success";
    }
  
    const status = getStatusByReason(statusName);
  
    return { status, body };
  };
  
  export const getResponseBody = (response, bodyKey) => {
    const { ok, ...body } = response;
  
    if (ok) return getSuccessBody(body, bodyKey);
  
    return getFailureBody(response);
  };
  