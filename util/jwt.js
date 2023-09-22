export const decode = token => {
    const [header, payload] = token.split(".");
  
    // Base64 decode the header and payload
    const decodedHeader = JSON.parse(Buffer.from(header, "base64").toString());
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString());
  
    return { header: decodedHeader, payload: decodedPayload };
  };
  