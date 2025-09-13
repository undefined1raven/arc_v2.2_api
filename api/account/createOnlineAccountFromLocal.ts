import { malformedRequestResponse } from "../../fn/maformedRequestResponse";
const { subtle } = require("crypto").webcrypto;
import crypto from "crypto";
type ExpectedRequestBody = {
  userData: {
    id: string;
    signupTime: number;
    publicKey: string;
    passwordHash: string | null;
    emailAddress: string | null;
    passkeys: string | null;
    PIKBackup: string;
    PSKBackup: string;
    RCKBackup: string;
    trustedDevices: string | null;
    oauthState: string | null;
    securityLogs: string | null;
    version: string;
    accountType: "online" | "local" | null;
  };
  appID: string;
};

////Sub-functions used in this API endpoint
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

function createChallenge(res, userData: ExpectedRequestBody["userData"]) {
  if (typeof userData.publicKey !== "string") {
    console.error("Invalid user public key type");
    malformedRequestResponse(res);
  }
  let publicKeyJSON;
  try {
    publicKeyJSON = JSON.parse(userData.publicKey);
  } catch (error) {
    console.error("Invalid public key JSON format");
    return malformedRequestResponse(res);
  }
  subtle
    .importKey(
      "jwk",
      publicKeyJSON,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    )
    .then((publicKey) => {
      const rawChallenge = crypto.randomBytes(32);
      const strinifiedChallenge = rawChallenge.toString("base64url");
      subtle
        .encrypt({ name: "RSA-OAEP" }, publicKey, rawChallenge)
        .then((encryptedChallenge) => {
          res.status(200).json({
            challenge: Buffer.from(encryptedChallenge).toString("base64url"),
            success: true,
            error: null,
          });
        })
        .catch((e) => {
          console.error("Challenge encryption failed", e);
          malformedRequestResponse(res);
        });
    })
    .catch((e) => {
      console.error("Public key import failed", e);
      malformedRequestResponse(res);
    });
}

function handler(req, res) {
  const body: ExpectedRequestBody = req.body.data;
  ///App ID check and body basic validation
  if (body === undefined || body?.appID !== process.env.APP_ID) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const hasValidUserData = verifyUserData(res, body.userData);
    if (!hasValidUserData) return;

    ///Create challenge for the user to decrypt with their private key
    console.log("Creating online account from local account");
    createChallenge(res, body.userData);
  }
}

export default handler;
