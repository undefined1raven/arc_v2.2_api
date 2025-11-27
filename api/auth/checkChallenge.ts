import { verifyUserData } from "../../fn/verifyUserData";
const { subtle, getRandomValues } = require("crypto").webcrypto;
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB, queryDB } from "../../fn/endpointBoilerplate";
import {
  generateCryptoChallenge,
  IgenerateCryptoChallengeResult,
} from "../../fn/common/generateCryptoChallenge";

function handler(req, res) {
  const body = req.body.data;
  if (
    body === undefined ||
    body?.appID !== process.env.APP_ID ||
    typeof body.accountID !== "string" ||
    typeof body.deviceId !== "string" ||
    body.deviceId?.includes("ADI-") === false ||
    typeof body.challengeResponse !== "string"
  ) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const { challengeResponse } = body;
    const rtdbPath = `/authTokenRequestChallenges/${validateRTDBPath(
      body.accountID
    )}/${validateRTDBPath(body.deviceId)}`;
  }
}

export default handler;
