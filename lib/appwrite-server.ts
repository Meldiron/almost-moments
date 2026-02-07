import { Client, TablesDB, Storage, Query } from "node-appwrite";
import { ENDPOINT, PROJECT_ID } from "@/lib/generated/appwrite/constants";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY!);

export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export { Query };
