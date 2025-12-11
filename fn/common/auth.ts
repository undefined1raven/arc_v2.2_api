import { getRTDB, setRTDB } from "../endpointBoilerplate.js";
import { validateRTDBPath } from "../validateRTDBPath.js";
import bcrypt from "bcrypt";

async function getNativeUserAuth(
  accountId: string,
  deviceId: string,
  clientSideAuthToken: string
): Promise<{
  authenticated: boolean;
  status: "failed" | "success";
  error: null | string;
}> {
  if (
    typeof accountId !== "string" ||
    typeof deviceId !== "string" ||
    typeof clientSideAuthToken !== "string"
  ) {
    return { authenticated: false, status: "failed", error: "Wront arg types" };
  }
  const authStackPath = `/authTokens/${validateRTDBPath(
    accountId
  )}/${validateRTDBPath(deviceId)}`;

  const authTokenResponse = await getRTDB(authStackPath);
  const authTokenTTL = 15 * 60 * 1000; // 15 minutes

  if (
    authTokenResponse === null ||
    typeof authTokenResponse?.authTokenHash !== "string" ||
    typeof authTokenResponse?.tx !== "number"
  ) {
    return {
      authenticated: false,
      status: "failed",
      error: "Failed to retrieve auth stack",
    };
  }

  if (Date.now() - authTokenResponse.tx > authTokenTTL) {
    console.log("Auth token expired");
    setRTDB(authStackPath, null); // Clean up expired token
    return {
      authenticated: false,
      status: "failed",
      error: "Auth token expired",
    };
  }

  const hasValidAuthToken = await bcrypt.compare(
    clientSideAuthToken,
    authTokenResponse.authTokenHash
  );

  if (hasValidAuthToken === true) {
    return { authenticated: true, status: "success", error: null };
  } else {
    console.log("NO TOKEN MATCH");

    return { authenticated: false, status: "failed", error: "Token not found" };
  }
}

export { getNativeUserAuth };
