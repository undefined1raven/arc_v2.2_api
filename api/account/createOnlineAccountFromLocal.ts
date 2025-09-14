import { ab2str } from "../../fn/ab2str";
import { stringToCharCodeArray } from "../../fn/charCodeStr";
import { malformedRequestResponse } from "../../fn/maformedRequestResponse";
const { subtle } = require("crypto").webcrypto;
import crypto from "crypto";
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB } from "../../fn/endpointBoilerplate";
import { ExpectedRequestBody } from "../../commonTypes/accountData";
import { verifyUserData } from "../../fn/verifyUserData";

////Sub-functions used in this API endpoint

async function createChallenge(res, userData: ExpectedRequestBody["userData"]) {
  const rtdbPath = `/accountTypeSwitch/${validateRTDBPath(userData.id)}`;
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
    .then(async (publicKey) => {
      const rawChallenge = crypto.randomBytes(32);
      subtle
        .encrypt({ name: "RSA-OAEP" }, publicKey, rawChallenge)
        .then(async (encryptedChallenge) => {
          const encryptedChallengeStr = JSON.stringify(
            stringToCharCodeArray(ab2str(encryptedChallenge))
          );

          await setRTDB(rtdbPath, {
            challenge: encryptedChallengeStr,
            tx: Date.now(),
          });

          res.status(200).json({
            challenge: encryptedChallengeStr,
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

async function handler(req, res) {
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
