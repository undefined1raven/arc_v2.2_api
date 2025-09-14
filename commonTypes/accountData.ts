interface ExpectedRequestBody {
  userData: {
    id: string;
    signupTime: number;
    publicKey: string;
    passwordHash: string | null;
    emailAddress: string | null;
    passkeys: string | null;
    PIKBackup: string;
    PSKBackup: string;
    RCKBackup: string;
    trustedDevices: string | null;
    oauthState: string | null;
    securityLogs: string | null;
    version: string;
    accountType: "online" | "local" | null;
  };
  appID: string;
}

type AuthPrivateKeyChallenge = {
  challenge: string;
  tx: number;
};

export type { ExpectedRequestBody, AuthPrivateKeyChallenge };
