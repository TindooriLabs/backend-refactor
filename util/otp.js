import randomatic from "randomatic";

export const generateOtp = ({ verificationCodeExpiration }, useOverride) => {
  //Generate a verification code
  let code = randomatic("0", 6);
  if (useOverride) {
    code = "123456";
  }
  const today = new Date();
  const verificationExpiration = today.addMinutes(verificationCodeExpiration);
  return { verificationCode: code, verificationExpiration };
};

export const validateOtp = async (
  code,
  verificationExpiration,
  codeVerifier
) => {
  const now = new Date();
  const isCodeValid = now.isBefore(verificationExpiration);
  if (!isCodeValid) {
    return { ok: true, verified: false };
  }
  const codeMatches = await codeVerifier(code);
  
  if (!codeMatches) {
    return { ok: true, verified: false };
  }

  return { ok: true, verified: true };
};
