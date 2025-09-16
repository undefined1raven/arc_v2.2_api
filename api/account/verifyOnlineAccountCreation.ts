import { ab2str } from "../../fn/ab2str";
import { stringToCharCodeArray } from "../../fn/charCodeStr";
import {
  errorResponse,
  malformedRequestResponse,
} from "../../fn/maformedRequestResponse";
const { subtle } = require("crypto").webcrypto;
import crypto from "crypto";
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB } from "../../fn/endpointBoilerplate";
import {
  AuthPrivateKeyChallenge,
  ExpectedRequestBody,
} from "../../commonTypes/accountData";
import { verifyUserData } from "../../fn/verifyUserData";

////Sub-functions used in this API endpoint
async function verifyChallenge(
  res,
  userData: ExpectedRequestBody["userData"],
  challengeResponse: string
) {
  const rtdbPath = `/accountTypeSwitch/${validateRTDBPath(userData.id)}`;
  if (typeof userData.publicKey !== "string") {
    console.error("Invalid user public key type");
    malformedRequestResponse(res);
    return false;
  }

  const plainChallengeStored: AuthPrivateKeyChallenge | null = await getRTDB(
    rtdbPath
  );

  if (plainChallengeStored === null) {
    errorResponse(res);
    return false;
  }

  const plainChallengeString = plainChallengeStored.challenge;

  if (
    typeof plainChallengeStored.challenge !== "string" ||
    typeof plainChallengeStored.tx !== "number"
  ) {
    errorResponse(res);
    return false;
  }

  if (plainChallengeString === challengeResponse) {
    return true;
  } else {
    console.error("Challenge mismatch, denying access");
    malformedRequestResponse(res);
    return false;
  }
  return false;
}

async function handler(req, res) {
  const body: ExpectedRequestBody & { challengeResponse: string } =
    req.body.data;
  ///App ID check and body basic validation
  if (body === undefined || body?.appID !== process.env.APP_ID) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const hasValidUserData = verifyUserData(res, body.userData);
    if (!hasValidUserData) return;
    const hasVerifiedPrivateKey = await verifyChallenge(
      res,
      body.userData,
      body.challengeResponse
    );

    if (hasVerifiedPrivateKey !== true) {
      return;
    }

    res.json({ success: "true" });
    return;

    ///From this point, the private key of the user is verified
    ///Continuing with adding the user account to the DB and generating challenges for performing ulterior API calls
  }
}

export default handler;
