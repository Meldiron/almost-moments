import { Client, Account, Storage, ID } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("698704120024e789953a");

export const account = new Account(client);
export const storage = new Storage(client);
export { ID };
