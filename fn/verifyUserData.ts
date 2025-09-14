import { ExpectedRequestBody } from "../commonTypes/accountData";
import { malformedRequestResponse } from "./maformedRequestResponse";

function verifyUserData(res, userData: ExpectedRequestBody["userData"]) {
  const requiredKeys = [
    "id",
    "signupTime",
    "publicKey",
    "passwordHash",
    "emailAddress",
    "passkeys",
    "PIKBackup",
    "PSKBackup",
    "RCKBackup",
    "trustedDevices",
    "oauthState",
    "securityLogs",
    "version",
  ];
  if (typeof userData !== "object") {
    console.error("VUD-1");
    malformedRequestResponse(res);
    return;
  }

  for (const key of requiredKeys) {
    if (key in userData === false) {
      console.error("VUD-2");
      malformedRequestResponse(res);
      return;
    }
  }

  ///Check the string fields
  const stringFields = [
    "id",
    "publicKey",
    "PIKBackup",
    "PSKBackup",
    "RCKBackup",
    "version",
  ] as const;

  for (const field of stringFields) {
    if (typeof userData[field] !== "string") {
      console.error("VUD-3");
      malformedRequestResponse(res);
      return;
    }
  }

  ///Check the nullable string fields
  const nullableStringFields = [
    "passwordHash",
    "emailAddress",
    "passkeys",
    "trustedDevices",
    "oauthState",
    "securityLogs",
  ] as const;

  for (const field of nullableStringFields) {
    if (userData[field] !== null && typeof userData[field] !== "string") {
      console.error("VUD-4");
      malformedRequestResponse(res);
      return;
    }
  }

  ///Check more specific fields
  const { signupTime } = userData;
  if (typeof signupTime !== "number" || !Number.isInteger(signupTime)) {
    console.error("VUD-5");
    malformedRequestResponse(res);
    return;
  }

  return true;
}

export { verifyUserData };
