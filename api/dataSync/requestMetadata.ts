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
    typeof body.deviceId !== "string"
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

    const timeTrackingMetadataPromise = queryDB(
      "SELECT hash, tx, timeRangeEnd, timeRangeStart, id FROM timeTrackingChunks WHERE userId = ?",
      [accountId]
    );
    const dayPlannerMetadataPromise = queryDB(
      "SELECT hash, tx, timeRangeEnd, timeRangeStart, id FROM dayPlannerChunks WHERE userId = ?",
      [accountId]
    );
    const personalDiaryMetadataPromise = queryDB(
      "SELECT hash, tx , id FROM personalDiaryChunks WHERE userId = ?",
      [accountId]
    );
    const diaryGroupsMetadataPromise = queryDB(
      "SELECT hash, tx, id FROM personalDiaryGroups WHERE userId = ?",
      [accountId]
    );
    const featureConfigMetadataPromise = queryDB(
      "SELECT hash, tx, id FROM featureConfigChunks WHERE userId = ?",
      [accountId]
    );

    const metadataResults = await Promise.allSettled([
      timeTrackingMetadataPromise,
      dayPlannerMetadataPromise,
      personalDiaryMetadataPromise,
      diaryGroupsMetadataPromise,
      featureConfigMetadataPromise,
    ]);

    const hasAnyRejections = metadataResults.some(
      (res) => res.status !== "fulfilled"
    );

    if (hasAnyRejections === true) {
      return res.status(500).json({ error: "Metadata fetch error" });
    }

    const tableNameMap = {
      0: "timeTrackingChunks",
      1: "dayPlannerChunks",
      2: "personalDiaryChunks",
      3: "personalDiaryGroups",
      4: "featureConfigChunks",
    };

    const finalResults = metadataResults.map((result, ix) => {
      //@ts-ignore
      return { metadata: result.value, tableName: tableNameMap[ix] };
    });

    return res
      .status(200)
      .json({ data: finalResults, status: "success", error: null });
  }
}

export default handler;
