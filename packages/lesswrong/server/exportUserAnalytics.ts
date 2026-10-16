import { getAnalyticsConnectionOrThrow } from "./analytics/postgresConnection";
import { writeFile } from "fs/promises";
import Users from "./collections/users/collection";

/**
 * Please ensure that we know that the user is who they say they are!
 * Exported to allow running with "yarn repl".
 */
export const exportUserAnalytics = async (
  selector: {_id?: string, slug?: string, email?: string},
  outfile?: string,
) => {
  if (!selector._id && !selector.slug && !selector.email) {
    throw new Error("Must specify either an _id, slug or email");
  }

  const user = await Users.findOne(selector);
  if (!user) {
    throw new Error("User not found: " + JSON.stringify(selector));
  }

  const db = getAnalyticsConnectionOrThrow();
  const result = await db.any(
    "SELECT * FROM raw WHERE event->>'userId' = $1 ORDER BY timestamp DESC",
    [user._id],
  );

  const stringified = JSON.stringify(result, null, 2);

  // eslint-disable-next-line no-console
  console.log("Exported user data:", stringified);

  if (outfile) {
    await writeFile(outfile, stringified);
  }

  return result;
}
