import { google } from "googleapis";

export async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL as string;
  const privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY as string)?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;
  
  console.log(`[Sheets] Client Email: ${clientEmail ? 'SET' : 'MISSING'}`);
  console.log(`[Sheets] Private Key: ${privateKey ? 'SET' : 'MISSING'}`);
  console.log(`[Sheets] Spreadsheet ID: ${spreadsheetId ? 'SET' : 'MISSING'}`);
  
  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(`Google Sheets kimlik bilgileri eksik: email=${!!clientEmail}, key=${!!privateKey}, sheet=${!!spreadsheetId}`);
  }
  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await jwt.authorize();
  const sheets = google.sheets({ version: "v4", auth: jwt });
  return sheets;
}

export async function appendRow(values: (string | number | null)[]) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sayfa1!A:Z",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values as (string | number)[]] },
  });
}

export async function queryRows(range: string): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (res.data.values as string[][]) || [];
}


