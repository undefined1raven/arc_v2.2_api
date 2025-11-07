import { getRTDB, setRTDB } from "../endpointBoilerplate.js";
import { validateRTDBPath } from "../validateRTDBPath.js";

async function getNativeUserAuth(
  accountId: string,
  deviceId: string,
  authToken: string
): Promise<{
  authenticated: boolean;
  status: "failed" | "success";
  error: null | string;
}> {
  if (
    typeof accountId !== "string" ||
    typeof deviceId !== "string" ||
    typeof authToken !== "string"
  ) {
    return { authenticated: false, status: "failed", error: "Wront arg types" };
  }
  const authStackPath = `/challengeStacks/${validateRTDBPath(
    accountId
  )}/${validateRTDBPath(deviceId)}`;

  const authStackResponse = await getRTDB(authStackPath);

  if (
    authStackResponse === null ||
    authStackResponse?.challengeResponses === undefined ||
    authStackResponse?.tx === undefined ||
    typeof authStackResponse.tx !== "number" ||
    Array.isArray(authStackResponse?.challengeResponses) === false
  ) {
    return {
      authenticated: false,
      status: "failed",
      error: "Failed to retrieve auth stack",
    };
  }

  const { challengeResponses, tx } = authStackResponse;
  const authTokens: string[] = challengeResponses;

  const hasValidAuthToken = authTokens.some((token) => token === authToken);
  if (hasValidAuthToken === true) {
    const newAuthStack = authTokens.filter((token) => token !== authToken);

    if (newAuthStack.length > 0) {
      await setRTDB(authStackPath, {
        challengeResponses: newAuthStack,
        tx: tx,
      });
    } else {
      await setRTDB(authStackPath, null);
    }

    return { authenticated: true, status: "success", error: null };
  } else {
    console.log("NO TOKEN MATCH");

    return { authenticated: false, status: "failed", error: "Token not found" };
  }
}

export { getNativeUserAuth };
