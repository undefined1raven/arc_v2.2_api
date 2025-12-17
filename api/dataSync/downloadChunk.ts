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
    (typeof body.tx !== "string" && typeof body.tx !== "number") ||
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

    if (authenticated === false) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { tableName, id } = body;
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

    return queryDB(`SELECT * FROM ${tableName} WHERE id = ? AND userId = ?`, [
      id,
      accountId,
    ]).then((result) => {
      if (result.error) {
        return res.status(500).json({ error: "Database error" });
      } else if (result.rows.length === 0) {
        return res.status(404).json({ error: "Chunk not found" });
      } else {
        const row = result.rows[0];
        return res.status(200).json({
          id: row.id,
          hash: row.hash,
          tx: row.tx,
          encryptedContent: row.encryptedContent,
          version: row.version,
        });
      }
    });
  }
}

export default handler;
