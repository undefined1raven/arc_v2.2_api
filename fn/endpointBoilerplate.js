require("dotenv").config();
import { validateRTDBPath } from "./validateRTDBPath";
const { get, remove, set, ref } = require("@firebase/database");
const cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const { createClient } = require("@libsql/client");
const TURSO_URL = process.env.PDP_URL;
const TURSO_KEY = process.env.PDP_KEY;
const RTDB_URL = process.env.RTDB_URL;
const tursoConfig = { url: TURSO_URL, authToken: TURSO_KEY };

var admin = require("firebase-admin");

var serviceAccount = JSON.parse(process.env.FIREBASE_SDK);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: RTDB_URL,
});

const db = admin.database();

function sendErrorResponse(res, e, id) {
  console.log(e);
  console.log(`ID: ${id}`);
  res.status(200).json({
    status: "Failed",
    error: e,
    id: id != undefined ? id : "Not Specified",
  });
}

async function getRTDB(path) {
  if (path !== undefined) {
    return get(ref(db, path))
      .then((snap) => {
        return snap.val();
      })
      .catch((e) => {
        return e;
      });
  } else {
    return { error: "Invalid Path" };
  }
}

async function setRTDB(path, data) {
  if (path !== undefined && data !== undefined) {
    return set(ref(db, path), data)
      .then(() => {
        return { status: "Success" };
      })
      .catch((e) => {
        return e;
      });
  } else {
    return { error: "Invalid Input [undefined path or data]" };
  }
}

/**
 *
 * @param {at: 'token'} cookies
 * @param Response res
 * @param Request req
 * @returns
 */

async function queryDB(queryStr, values) {
  const tursoDB = createClient(tursoConfig);
  const DBquery = new Promise((resolve, reject) => {
    const tursoDBPromise =
      values !== undefined
        ? tursoDB.execute({ sql: queryStr, args: values })
        : tursoDB.execute(queryStr);
    tursoDBPromise
      .then((rx) => {
        // console.log(rx.rows[0])
        resolve(rx.rows);
      })
      .catch((e) => {
        console.log(`TDB EXE Failed: ${e}`);
        reject(e);
      });
  });

  return DBquery;
}

const cookieOpts = {
  httpOnly: true,
  priority: "high",
  sameSite: true,
  path: "/",
  secure: true,
  maxAge: 1704085200 * 1000,
};

function setCommonHeaders(appArg) {
  appArg.use(bodyParser.json());
  appArg.use(express.urlencoded({ extended: true }));
  appArg.use(cookieParser());
  appArg.use((req, res, next) => {
    // res.setHeader('Content-Security-Policy', "default-src 'self'; font-src 'self' https://fonts.gstatic.com 'sha256-HKUd5PpYnXidtaGPY/HUnPf7XvJnSuJMqusXttreQC0=' 'sha256-z7zcnw/4WalZqx+PrNaRnoeLz/G9WXuFqV1WCJ129sg='; img-src 'self' data: https://cdn.maptiler.com; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.maptiler.com; style-src 'self' 'unsafe-hashes' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.maptiler.com 'sha256-HKUd5PpYnXidtaGPY/HUnPf7XvJnSuJMqusXttreQC0=' 'sha256-z7zcnw/4WalZqx+PrNaRnoeLz/G9WXuFqV1WCJ129sg='; frame-src 'self'; worker-src 'self' https://cdn.maptiler.com blob:; connect-src https://api.maptiler.com http://localhost:3300 ws://localhost:3300 https://vulture-uplink.com/ https://vulture-uplink.herokuapp.com/ wss://vulture-uplink.com/ wss://vulture-uplink.herokuapp.com/; object-src 'none';");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-powered-by", "Antimatter");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
  });
}

///NOT TO BE USED WITH THE NATIVE VERSION OF THE APP
async function getUserAuth(cookies, res, req) {
  if (res === undefined) {
    return { authed: false, reason: "No response object" };
  } else {
    if (cookies === undefined) {
      return { authed: false, reason: "No Cookies" };
    } else if (cookies.at === undefined) {
      return { authed: false, reason: "No Auth Cookie" };
    } else if (cookies.accountID === undefined) {
      return { authed: false, reason: "No AccountID Cookie" };
    } else {
      return get(
        ref(
          db,
          `authTokens/${validateRTDBPath(cookies.accountID)}/${cookies.at}`
        )
      )
        .then((snap) => {
          let RTDBAuthToken = snap.val();
          if (RTDBAuthToken === null) {
            return { authed: false, reason: "No Auth Cookie Match W RTDB" };
          } else if (Date.now() - parseFloat(RTDBAuthToken.tx) < 0) {
            return remove(ref(db, "authTokens/" + cookies.at))
              .then(() => {
                return { authed: false, reason: "Auth Token Expired" };
              })
              .catch((e) => {
                console.log(e);
                return { authed: false, reason: "RTDB rm FAIL", error: e };
              });
          } else {
            return { authed: true };
          }
        })
        .catch((e) => {
          console.log(e);
          return { authed: false, reason: "RTDB GET FAIL", error: e };
        });
    }
  }
}

export {
  sendErrorResponse,
  getUserAuth,
  setRTDB,
  getRTDB,
  queryDB,
  cookieOpts,
  setCommonHeaders,
};
