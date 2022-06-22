import {
  useCogsConfig,
  useCogsConnection,
  useCogsEvent,
  useIsConnected,
} from "@clockworkdog/cogs-client-react";
import { useCallback, useMemo } from "react";
import "./App.css";
import useGoogleApi from "./googleApi";
import parseRow from "./parseRow";

const GOOGLE_API_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const GOOGLE_API_DISCOVERY_DOCS = [
  "https://sheets.googleapis.com/$discovery/rest?version=v4",
];

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

  const serviceAccount = useMemo(
    () => (serviceAccountJson ? JSON.parse(serviceAccountJson) : undefined),
    [serviceAccountJson]
  );

  const googleApi = useGoogleApi({
    discoveryDocs: GOOGLE_API_DISCOVERY_DOCS,
    scopes: GOOGLE_API_SCOPES,
    serviceAccount,
  });

  const appendRow = useCallback(
    (rowString: string) => {
      const row = parseRow(rowString);

      console.log(row);

      if (!googleApi) {
        console.warn("Google API not loaded yet");
        return;
      }

      googleApi.client.sheets.spreadsheets.values
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
    [spreadsheetId, tabName, googleApi]
  );

  useCogsEvent(connection, "Append Row", appendRow);

  return (
    <div className="App">
      <div>{!isConnected && "Not connected"}</div>
      <div>{isConnected && !googleApi && "Loading..."}</div>
    </div>
  );
}
