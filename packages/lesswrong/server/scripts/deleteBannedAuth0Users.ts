/* eslint-disable no-console */

import { Auth0Client } from "../authentication/auth0";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import type { ManagementClient } from "auth0";

const getAuth0UserCount = async (auth0: ManagementClient): Promise<number> => {
  const result = await auth0.getUsers({
    page: 0,
    per_page: 0,
    include_totals: true,
  });
  return result.total;
}

export const deleteBannedAuth0Users = async () => {
  const auth0 = new Auth0Client().getManagementClient();

  const beforeCount = await getAuth0UserCount(auth0);
  console.log(`Auth0 users before: ${beforeCount}`);

  const db = getSqlClientOrThrow();

  try {
    const result = await db.any<{ auth0Id: string }>(`
      SELECT "services"->'auth0'->>'id' AS "auth0Id"
      FROM "Users"
      WHERE
        "banned" >= NOW() + INTERVAL '8 years'
        AND "services"->'auth0'->>'id' IS NOT NULL
    `);

    console.log(`Users matching deletion criteria: ${result.length}`);

    let deleted = 0;
    let failed = 0;

    for (const user of result) {
      try {
        console.log(`Deleting Auth0 user: ${user.auth0Id}`);
        await auth0.deleteUser({ id: user.auth0Id });
        deleted++;
      } catch (error) {
        failed++;
        console.error(
          `Failed to delete ${user.auth0Id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`Successfully deleted: ${deleted}`);
    console.log(`Failed: ${failed}`);
  } catch (e) {
    console.error("Error:", e);
  }

  const afterCount = await getAuth0UserCount(auth0);
  console.log(`Auth0 users after: ${afterCount}`);
  console.log(`Auth0 users deleted: ${beforeCount - afterCount}`);
}
