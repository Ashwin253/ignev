import { Client, Databases } from "appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";

export function getServerDatabases() {
  if (!projectId || !apiKey) {
    throw new Error(
      "Missing Appwrite server config. Set NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY."
    );
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new Databases(client);
}
