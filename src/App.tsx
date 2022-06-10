import {
  useCogsConfig,
  useCogsConnection,
  useCogsEvent,
  useIsConnected,
} from "@clockworkdog/cogs-client-react";
import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import getAccessTokenFromServiceAccount from "./getAccessTokenFromServiceAccount";

export default function App() {
  const connection = useCogsConnection<{
    config: {
      "Service Account JSON": string;
      "Spreadsheet ID": string;
      "Tab Name": string;
    };
    inputEvents: {
      "Append Row": string;
    };
  }>();
  const isConnected = useIsConnected(connection);
  const {
    "Service Account JSON": serviceAccountJson,
    "Spreadsheet ID": spreadsheetId,
    "Tab Name": tabName,
  } = useCogsConfig(connection);

  const [ready, setReady] = useState(false);

  // Authenticate with Google Sheets
  useEffect(() => {
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      serviceAccount.scopes = ["https://www.googleapis.com/auth/spreadsheets"];

      (async () => {
        const accessToken = await getAccessTokenFromServiceAccount(
          serviceAccount
        );

        gapi.load("client", async () => {
          gapi.auth.setToken(accessToken);

          await gapi.client.init({
            discoveryDocs: [
              "https://sheets.googleapis.com/$discovery/rest?version=v4",
            ],
          });

          setReady(true);
        });
      })();
    }
  }, [serviceAccountJson]);

  const appendRow = useCallback(
    (rowString: string) => {
      const row = rowString.split(",");
      console.log(row);

      gapi.client.sheets.spreadsheets.values
        .append({
          spreadsheetId: spreadsheetId,
          range: `${tabName}!A1:E`,
          resource: {
            values: [row],
          },
          valueInputOption: "USER_ENTERED",
        })
        .then((response) => {
          console.log(
            `${response.result.updates?.updatedCells} cells appended.`
          );
        });
    },
    [spreadsheetId, tabName]
  );

  useCogsEvent(connection, "Append Row", appendRow);

  return (
    <div className="App">
      <div>{!isConnected && "Not connected"}</div>
      <div>{isConnected && !ready && "Loading..."}</div>
    </div>
  );
}
