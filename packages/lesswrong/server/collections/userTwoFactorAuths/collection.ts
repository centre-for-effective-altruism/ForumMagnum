import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const UserTwoFactorAuths: UserTwoFactorAuthsCollection = createCollection({
  collectionName: "UserTwoFactorAuths",
  typeName: "UserTwoFactorAuth",
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserTwoFactorAuths', {userId: 1}, {unique: true});
    return indexSet;
  },
});

export default UserTwoFactorAuths;
