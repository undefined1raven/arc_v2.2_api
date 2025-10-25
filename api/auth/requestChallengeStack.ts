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
  console.log("Request challenge stack hit");
  const startTime = Date.now();
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
        const challengePromises: Promise<IgenerateCryptoChallengeResult>[] = [];
        for (let ix = 0; ix < 15; ix++) {
          const challengePromise = generateCryptoChallenge(publicKey);
          challengePromises.push(challengePromise);
        }
        Promise.allSettled(challengePromises)
          .then(async (challenges) => {
            const successfulChallenges = challenges.filter(
              (
                result
              ): result is PromiseFulfilledResult<IgenerateCryptoChallengeResult> =>
                result.status === "fulfilled" &&
                result.value.status === "success"
            );

            const encryptedChallenges = successfulChallenges.map(
              (challenge) => challenge.value.encryptedChallenge!
            );
            const plainChallengeResponses = successfulChallenges.map(
              (challenge) => challenge.value.plainChallenge!
            );

            const rtdbPath = `/challengeStacks/${validateRTDBPath(
              body.accountID
            )}/${validateRTDBPath(body.deviceId)}`;
            let existingData: null | {
              tx: number;
              challengeResponses: string[];
            } = await getRTDB(rtdbPath);
            let plainChallengeResponsesToStore = plainChallengeResponses;
            if (
              existingData !== null &&
              existingData?.challengeResponses?.length > 0
            ) {
              plainChallengeResponsesToStore =
                existingData.challengeResponses.concat(plainChallengeResponses);
            }

            await setRTDB(rtdbPath, {
              challengeResponses: plainChallengeResponsesToStore,
              tx: Date.now(),
            });

            res.json({
              status: "success",
              error: null,
              challenges: encryptedChallenges,
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
