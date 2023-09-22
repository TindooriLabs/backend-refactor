import pg from 'pg';
const { Pool } = pg;
import { secretsClient } from "../clients/secrets-manager.js";

//Override pg default to not automatically adjust timezone when selecting timestamp without timezone columns
pg.types.setTypeParser(1114, function (stringValue) {
  return new Date(stringValue + "z"); //Add 'z' to return timestamp in UTC
});

let postgresDb;

//Connection
export async function connectPostgres() {
  const useLocal = process.env.TINDOORI_USE_LOCAL;
  let connectionConfig;
  if (useLocal === "true") {
    //Respect the local environment variables if useLocal is true
    connectionConfig = {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD
    };
  } else {
    //Retrieve secrets from AWS
    const dbPasswordSecretName = `postgres-${process.env.ENV}`;
    const dbPasswords = await secretsClient.get(dbPasswordSecretName);
    connectionConfig = {
      host: dbPasswords.host,
      port: dbPasswords.port,
      database: dbPasswords.database,
      user: dbPasswords.user,
      password: dbPasswords.password
    };
  }

  postgresDb = new Pool(connectionConfig);
  console.log("Connected to Postgres DB.");
}

export default postgresDb;
