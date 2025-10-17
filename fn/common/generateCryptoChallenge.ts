const { subtle } = require("crypto").webcrypto;
import crypto from "crypto";
import { stringToCharCodeArray } from "../charCodeStr";
import { ab2str } from "../../fn/ab2str";

/*
Generates an encrypted crypto challenge using the provided public key.
*/

interface IgenerateCryptoChallengeResult {
  status: "success" | "error";
  error: string | null;
  plainChallenge?: string;
  encryptedChallenge?: string;
}

async function generateCryptoChallenge(
  publicKeyStr: string
): Promise<IgenerateCryptoChallengeResult> {
  let publicKeyJSON;
  try {
    publicKeyJSON = JSON.parse(publicKeyStr);
  } catch (error) {
    console.error("Invalid public key JSON format");
    return {
      error: "Invalid public key JSON format: " + error,
      status: "error",
    };
  }
  return subtle
    .importKey(
      "jwk",
      publicKeyJSON,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    )
    .then(async (publicKey) => {
      const rawChallenge = crypto.randomBytes(32);
      const plainChallengeStr = rawChallenge.toString("base64");
      return subtle
        .encrypt({ name: "RSA-OAEP" }, publicKey, rawChallenge)
        .then(async (encryptedChallenge) => {
          const encryptedChallengeStr = JSON.stringify(
            stringToCharCodeArray(ab2str(encryptedChallenge))
          );
          return {
            status: "success",
            error: null,
            plainChallenge: plainChallengeStr,
            encryptedChallenge: encryptedChallengeStr,
          };
        })
        .catch((e) => {
          console.error("Challenge encryption failed", e);
          return {
            error: "Challenge encryption failed: " + e,
            status: "error",
          };
        });
    })
    .catch((e) => {
      console.error("Public key import failed", e);
      return { error: "Public key import failed: " + e, status: "error" };
    });
}

export { generateCryptoChallenge };
export type { IgenerateCryptoChallengeResult };
