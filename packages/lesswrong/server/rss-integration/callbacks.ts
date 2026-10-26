import { fetchFeedItems } from './fetchFeedItems';

export async function populateRawFeed(feed: CreateRSSFeedDataInput) {
  const url = feed.url;
  // These are only used to avoid importing posts that already exist when the
  // feed is created, so we don't need their bodies
  const currentPosts = await fetchFeedItems(url, {shouldFetchBody: () => false});
  feed.rawFeed = currentPosts;
  //eslint-disable-next-line no-console
  console.log("Imported new RSS feeds, set past posts to: ", feed.rawFeed);
  return feed;
}
