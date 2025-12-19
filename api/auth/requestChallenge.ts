import { verifyUserData } from "../../fn/verifyUserData";
const { subtle, getRandomValues } = require("crypto").webcrypto;
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB, queryDB } from "../../fn/endpointBoilerplate";
import {
  generateCryptoChallenge,
  IgenerateCryptoChallengeResult,
} from "../../fn/common/generateCryptoChallenge";
import bcrypt from "bcrypt";

function handler(req, res) {
  const body = req.body.data;
  console.log("Request challenge hit");
  if (
    body === undefined ||
    body?.appID !== process.env.APP_ID ||
    typeof body.accountID !== "string" ||
    typeof body.deviceId !== "string" ||
    body.deviceId?.includes("ADI-") === false
  ) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    queryDB(`SELECT publicKey FROM users WHERE id = :userID`, {
      userID: body.accountID,
    }).then((dbResponse) => {
      if (dbResponse.length === 0) {
        console.error("No user found with that ID");
        return res.status(400).json({ error: "-" });
      } else {
        const publicKey = dbResponse[0].publicKey;
        generateCryptoChallenge(publicKey)
          .then(async (challenge) => {
            const encryptedChallenge = challenge.encryptedChallenge!;
            const plainChallengeResponse = challenge.plainChallenge!;

            const hashedChallenge = await bcrypt.hash(
              plainChallengeResponse,
              10
            );

            const rtdbPath = `/authTokens/${validateRTDBPath(
              body.accountID
            )}/${validateRTDBPath(body.deviceId)}`;

            await setRTDB(rtdbPath, {
              authTokenHash: hashedChallenge,
              tx: Date.now(),
            });

            res.json({
              status: "success",
              error: null,
              challenge: encryptedChallenge,
            });
          })
          .catch((e) => {
            console.error("Error generating challenges:", e);
            return res.status(500).json({ error: "Internal server error" });
          });
      }
    });
  }
}

export default handler;
