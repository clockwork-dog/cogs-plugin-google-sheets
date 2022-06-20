import { useCallback, useEffect, useState } from "react";
import getAccessTokenFromServiceAccount, {
  GoogleApiAccessToken,
  ServiceAccountJson,
} from "./getAccessTokenFromServiceAccount";

function useGoogleApiAccessToken(
  scopes: string[],
  serviceAccount: ServiceAccountJson | undefined,
  earlyTokenRefresh_seconds = 30
): GoogleApiAccessToken | undefined {
  const [accessToken, setAccessToken] = useState<GoogleApiAccessToken>();

  const getAccessToken = useCallback(() => {
    if (serviceAccount) {
      const serviceAccountWithScopes = { ...serviceAccount, scopes };

      let refreshAccessTokenTimeout: NodeJS.Timeout | null;

      getAccessTokenFromServiceAccount(serviceAccountWithScopes).then(
        (newAccessToken) => {
          setAccessToken(newAccessToken);
          refreshAccessTokenTimeout = setTimeout(
            getAccessToken,
            (newAccessToken.expires_in - earlyTokenRefresh_seconds) * 1000
          );
        }
      );

      return () => {
        if (refreshAccessTokenTimeout) {
          clearTimeout(refreshAccessTokenTimeout);
        }
      };
    }
  }, [serviceAccount, scopes, earlyTokenRefresh_seconds]);

  useEffect(() => {
    const cancel = getAccessToken();
    return cancel;
  }, [getAccessToken]);

  return accessToken;
}

function useGoogleApiUnauthenticated(discoveryDocs: string[]) {
  const [googleApi, setGoogleApi] = useState<typeof gapi>();

  useEffect(() => {
    gapi.load("client", () => {
      gapi.client.init({ discoveryDocs }).then(() => {
        setGoogleApi(gapi);
      });
    });
  }, [discoveryDocs]);

  return googleApi;
}

export default function useGoogleApi(options: {
  scopes: string[];
  discoveryDocs: string[];
  serviceAccount: ServiceAccountJson;
  earlyTokenRefresh_seconds?: number;
}) {
  const googleApi = useGoogleApiUnauthenticated(options.discoveryDocs);
  const accessToken = useGoogleApiAccessToken(
    options.scopes,
    options.serviceAccount,
    options.earlyTokenRefresh_seconds
  );

  useEffect(() => {
    if (googleApi && accessToken) {
      // Types don't quite match up bit it works
      googleApi.auth.setToken(
        accessToken as unknown as GoogleApiOAuth2TokenObject
      );
    }
  }, [accessToken, googleApi]);

  return googleApi && accessToken ? googleApi : undefined;
}
