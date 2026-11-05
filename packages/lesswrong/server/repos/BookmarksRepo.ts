import { recordPerfMetrics } from "./perfMetricWrapper";
import AbstractRepo from "./AbstractRepo";
import { Bookmarks } from "../collections/bookmarks/collection";
import { randomId } from "@/lib/random";

class BookmarksRepo extends AbstractRepo<"Bookmarks"> {
  constructor() {
    super(Bookmarks);
  }

  public async upsertBookmark(userId: string, documentId: string, collectionName: string): Promise<DbBookmark> {
    return this.one(`
      INSERT INTO "Bookmarks" ("_id", "userId", "documentId", "collectionName", "active", "createdAt", "lastUpdated")
      VALUES ($(bookmarkId), $(userId), $(documentId), $(collectionName), true, NOW(), NOW())
      ON CONFLICT ("userId", "documentId", "collectionName") DO UPDATE 
      SET 
        "active" = NOT "Bookmarks"."active",
        "lastUpdated" = NOW()
      WHERE "Bookmarks"."userId" = $(userId) 
        AND "Bookmarks"."documentId" = $(documentId) 
        AND "Bookmarks"."collectionName" = $(collectionName)
      RETURNING *
    `, {
      bookmarkId: randomId(),
      userId,
      documentId,
      collectionName,
    });
  }
}

recordPerfMetrics(BookmarksRepo);

export default BookmarksRepo; 
