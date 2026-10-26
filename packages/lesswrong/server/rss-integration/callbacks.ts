import { fetchFeedItems } from './fetchFeedItems';

/**
 * The stored items in `rawFeed` are only used to check which posts we've
 * already seen, so we don't store the whole item (which includes the body).
 */
export const toRawFeedItem = (item: AnyBecauseHard) => ({
  guid: item.guid,
  link: item.link,
  title: item.title,
});

export async function populateRawFeed(feed: CreateRSSFeedDataInput) {
  const url = feed.url;
  // These are only used to avoid importing posts that already exist when the
  // feed is created, so we don't need their bodies
  const currentPosts = await fetchFeedItems(url, {shouldFetchBody: () => false});
  feed.rawFeed = currentPosts.map(toRawFeedItem);
  //eslint-disable-next-line no-console
  console.log("Imported new RSS feeds, set past posts to: ", feed.rawFeed);
  return feed;
}
