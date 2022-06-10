// This is a Javascript library to retrieve the access token from the Google Service Account.
// Adapted from  https://github.com/tanaikech/GetAccessTokenFromServiceAccount_js

import { JSEncrypt } from "jsencrypt";
import CryptoJS from "crypto-js";

const _url = "https://www.googleapis.com/oauth2/v4/token";
const _grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer";

export interface ServiceAccountJson {
  userEmail: string;
  scopes: string[];
  private_key: string;
  client_email: string;
}

export default async function getAccessTokenFromServiceAccount(
  serviceAccountJson: ServiceAccountJson
) {
  const { private_key, client_email, scopes } = serviceAccountJson;
  if (!private_key || !client_email || !scopes) {
    throw new Error(
      "No required values. Please set 'private_key', 'client_email' and 'scopes'"
    );
  }
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim: Record<string, string> = {
    iss: client_email,
    scope: scopes.join(" "),
    aud: _url,
    exp: (now + 3600).toString(),
    iat: now.toString(),
  };
  if (serviceAccountJson.userEmail) {
    claim.sub = serviceAccountJson.userEmail;
  }
  const signature =
    btoa(JSON.stringify(header)) + "." + btoa(JSON.stringify(claim));
  const sign = new JSEncrypt();
  sign.setPrivateKey(private_key);
  const jwt = signature + "." + sign.sign(signature, sha256, "sha256");
  const params = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assertion: jwt,
      grant_type: _grant_type,
    }),
  };

  return await (await fetch(_url, params)).json();
}

const sha256 = (str: string) => CryptoJS.SHA256(str).toString();
