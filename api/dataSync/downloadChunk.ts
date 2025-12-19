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

  const tx = Date.now();
  console.log("DONN REQ HIT");

  if (
    body === undefined ||
    body?.appID !== process.env.APP_ID ||
    typeof body.authToken !== "string" ||
    typeof body.accountId !== "string" ||
    typeof body.deviceId !== "string" ||
    typeof body.tableName !== "string" ||
    typeof body.id !== "string"
  ) {
    console.log(
      "downloadChunk - invalid request body",
      body === undefined,
      body?.appID !== process.env.APP_ID,
      typeof body.authToken !== "string",
      typeof body.accountId !== "string",
      typeof body.deviceId !== "string",
      body.tableName,
      body.id
    );
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const { authToken, accountId, deviceId } = body;
    const { authenticated, status, error } = await getNativeUserAuth(
      accountId,
      deviceId,
      authToken
    );

    const t2 = Date.now();
    console.log("DOWN REQ----AUTH DURATION:", Date.now() - tx);

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
    ]).then((rows) => {
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Chunk not found", status: "error" });
      } else {
        console.log("DONN REQ DB DURATION", Date.now() - t2);
        return res
          .status(200)
          .json({ chunk: rows[0], status: "success", tableName: tableName });
      }
    });
  }
}

export default handler;
