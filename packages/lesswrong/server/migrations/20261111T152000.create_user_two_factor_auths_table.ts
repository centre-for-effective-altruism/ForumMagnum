import { createTable, updateIndexes } from "./meta/utils"
import UserTwoFactorAuths from "../collections/userTwoFactorAuths/collection";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, UserTwoFactorAuths);
  await updateIndexes(UserTwoFactorAuths);
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`DROP TABLE "UserTwoFactorAuths"`);
}
