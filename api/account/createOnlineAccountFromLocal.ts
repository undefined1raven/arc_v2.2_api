import { ab2str } from "../../fn/ab2str";
import { stringToCharCodeArray } from "../../fn/charCodeStr";
import { malformedRequestResponse } from "../../fn/maformedRequestResponse";
const { subtle } = require("crypto").webcrypto;
import crypto from "crypto";
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB } from "../../fn/endpointBoilerplate";
import { ExpectedRequestBody } from "../../commonTypes/accountData";
import { verifyUserData } from "../../fn/verifyUserData";
import { generateCryptoChallenge } from "../../fn/common/generateCryptoChallenge";

////Sub-functions used in this API endpoint

async function createChallenge(res, userData: ExpectedRequestBody["userData"]) {
  const rtdbPath = `/accountTypeSwitch/${validateRTDBPath(userData.id)}`;
  if (typeof userData.publicKey !== "string") {
    console.error("Invalid user public key type");
    malformedRequestResponse(res);
  }

  const { status, error, plainChallenge, encryptedChallenge } =
    await generateCryptoChallenge(userData.publicKey);

  if (status === "error") {
    console.error("Failed to generate crypto challenge:", error);
    return malformedRequestResponse(res);
  }

  await setRTDB(rtdbPath, {
    challenge: plainChallenge,
    tx: Date.now(),
  });

  res.status(200).json({
    challenge: encryptedChallenge,
    success: true,
    error: null,
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
