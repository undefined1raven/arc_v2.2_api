import { verifyUserData } from "../../fn/verifyUserData";
const { subtle, getRandomValues } = require("crypto").webcrypto;
import { validateRTDBPath } from "../../fn/validateRTDBPath";
import { getRTDB, setRTDB, queryDB } from "../../fn/endpointBoilerplate";
import {
  generateCryptoChallenge,
  IgenerateCryptoChallengeResult,
} from "../../fn/common/generateCryptoChallenge";
import { getNativeUserAuth } from "../../fn/common/auth";

async function handler(req, res) {
  const body = req.body.data;
  if (
    body === undefined ||
    body?.appID !== process.env.APP_ID ||
    typeof body.authToken !== "string" ||
    typeof body.accountId !== "string" ||
    typeof body.deviceId !== "string" ||
    typeof body.hash !== "string" ||
    typeof body.tx !== "number" ||
    typeof body.tableName !== "string" ||
    typeof body.encryptedContent !== "string" ||
    typeof body.id !== "string" ||
    typeof body.version !== "string"
  ) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const { authToken, accountId, deviceId } = body;
    const { authenticated, status, error } = await getNativeUserAuth(
      accountId,
      deviceId,
      authToken
    );

    // if (authenticated === false) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    const { hash, tx, tableName, encryptedContent, id, version } = body;
    const validTables = [
      "timeTrackingChunks",
      "dayPlannerChunks",
      "personalDiaryChunks",
      "featureConfigChunks",
      "personalDiaryGroups",
    ];
    if (validTables.includes(tableName) === false) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    if (
      tableName !== "timeTrackingChunks" &&
      tableName !== "dayPlannerChunks"
    ) {
      return queryDB(
        `INSERT INTO ${tableName} (id, userId, hash, tx, encryptedContent, version)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     hash = excluded.hash,
     tx = excluded.tx,
     encryptedContent = excluded.encryptedContent,
     version = excluded.version`,
        [id, accountId, hash, tx, encryptedContent, version]
      )
        .then((r) => {
          console.log("Chunk updated successfully:");
          return res.status(200).json({ success: true });
        })
        .catch((e) => {
          console.error("DB error updating chunk:", e);
          return res.status(500).json({ error: "Internal server error" });
        });
    } else {
      const { timeRangeStart, timeRangeEnd } = body;
      if (
        typeof timeRangeStart !== "number" ||
        typeof timeRangeEnd !== "number"
      ) {
        return res.status(400).json({ error: "Invalid time range" });
      }

      return queryDB(
        `INSERT INTO ${tableName} (
     id, userId, hash, tx, encryptedContent, version, timeRangeStart, timeRangeEnd
   )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET
     hash = excluded.hash,
     tx = excluded.tx,
     encryptedContent = excluded.encryptedContent,
     version = excluded.version,
     timeRangeStart = excluded.timeRangeStart,
     timeRangeEnd = excluded.timeRangeEnd`,
        [
          id,
          accountId,
          hash,
          tx,
          encryptedContent,
          version,
          timeRangeStart,
          timeRangeEnd,
        ]
      )
        .then((r) => {
          console.log("Chunk updated successfully:");
          return res.status(200).json({ success: true });
        })
        .catch((e) => {
          console.error("DB error updating chunk:", e);
          return res.status(500).json({ error: "Internal server error" });
        });
    }
  }
}

export default handler;
