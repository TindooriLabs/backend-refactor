import pg from 'pg';
const { Pool } = pg;
import queries from "./postgres-queries.js";
import { secretsClient } from "../clients/secrets-manager.js";

//Override pg default to not automatically adjust timezone when selecting timestamp without timezone columns
pg.types.setTypeParser(1114, function (stringValue) {
  return new Date(stringValue + "z"); //Add 'z' to return timestamp in UTC
});

let postgresDb, runQuery, runTransactionalizedQueries;

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

  //Query wrapper
  runQuery = async (query, values, rowKey = "rows", isSingular = false) => {
    const result = await postgresDb.query(query, values);
    return {
      ok: true,
      rowsAffected: result.rowCount,
      [rowKey]: isSingular ? result.rows[0] : result.rows
    };
  };

  runTransactionalizedQueries = async queries => {
    const client = await postgresDb.connect();
    try {
      for await (const query of queries) {
        await client.query("BEGIN"); // start a new transaction

        const result = await client.query(query);
        if (!result?.rowCount) {
          throw `Transactionalized query failed: ${result}`;
        }
      }

      await client.query("COMMIT"); // commit the transaction

      client.release();
      return { ok: true };
    } catch (error) {
      await client.query("ROLLBACK"); // rollback the transaction

      client.release();
      return { ok: false, reason: "server-error", message: error.message };
    }
  };

  postgresDb = new Pool(connectionConfig);
  console.log("Connected to Postgres DB.");
}


export { queries, runQuery, runTransactionalizedQueries };
export default postgresDb;
