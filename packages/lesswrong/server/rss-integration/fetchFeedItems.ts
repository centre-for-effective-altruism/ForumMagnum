import feedparser from 'feedparser-promised';

// Substack doesn't provide RSS feeds for individual topics (eg;
// https://example.substack.com/t/some-topic), so for those URLs we fetch the
// posts from the same (undocumented) JSON API that the topic page uses, and
// convert them into the same shape that feedparser returns.
const SUBSTACK_TOPIC_PATH_REGEX = /^\/t\/([^/]+)\/?$/;

// The most posts Substack's archive endpoint will return in one request
const SUBSTACK_ARCHIVE_LIMIT = 50;

const SUBSTACK_TIMEOUT_MS = 30_000;

interface SubstackPostTag {
  id: string,
  slug: string,
}

interface SubstackArchivePost {
  type: string,
  slug: string,
  title: string,
  subtitle?: string | null,
  description?: string | null,
  canonical_url: string,
  post_date: string,
}

interface SubstackFullPost {
  body_html?: string | null,
  truncated_body_text?: string | null,
}

interface FetchFeedItemsOptions {
  /**
   * Some sources (currently just Substack topics) need an extra request per
   * item to get its body. This can be used to say which items actually need
   * one - the rest will only have their summary as their description. Plain
   * RSS feeds ignore this and always include the body.
   */
  shouldFetchBody?: (item: {guid: string, link: string}) => boolean,
}

/**
 * Fetch the items for an RSS feed. Usually this just parses the feed at the
 * given URL, but Substack topic URLs are handled specially (see above).
 */
export const fetchFeedItems = async (
  url: string,
  {shouldFetchBody = () => true}: FetchFeedItemsOptions = {},
): Promise<AnyBecauseHard[]> => {
  const substackTopic = parseSubstackTopicUrl(url);
  if (substackTopic) {
    return fetchSubstackTopicItems(
      substackTopic.origin,
      substackTopic.tagSlug,
      shouldFetchBody,
    );
  }
  return feedparser.parse(url);
}

const parseSubstackTopicUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (e) {
    return null;
  }
  const match = parsed.pathname.match(SUBSTACK_TOPIC_PATH_REGEX);
  if (!match) {
    return null;
  }
  return {
    origin: parsed.origin,
    tagSlug: decodeURIComponent(match[1]),
  };
}

const fetchSubstackJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {Accept: "application/json"},
    signal: AbortSignal.timeout(SUBSTACK_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Substack request to ${url} failed with status ${response.status}`);
  }
  return response.json();
}

const fetchSubstackTopicItems = async (
  origin: string,
  tagSlug: string,
  shouldFetchBody: NonNullable<FetchFeedItemsOptions["shouldFetchBody"]>,
) => {
  const tag = await fetchSubstackJson<SubstackPostTag>(
    `${origin}/api/v1/publication/post-tag/slug/${encodeURIComponent(tagSlug)}`,
  );
  if (!tag?.id) {
    throw new Error(`Substack topic "${tagSlug}" not found at ${origin}`);
  }

  // Note that the archive endpoint silently ignores unknown query params, so
  // if this ever changes we'll get _every_ post rather than an error
  const params = new URLSearchParams({
    sort: "new",
    limit: String(SUBSTACK_ARCHIVE_LIMIT),
    post_tag_id: tag.id,
  });
  const posts = await fetchSubstackJson<SubstackArchivePost[]>(
    `${origin}/api/v1/archive?${params}`,
  );

  // Restacks are other people's posts that have been shared - we don't want
  // to import those under this feed's user
  const ownPosts = posts.filter((post) => post.type !== "restack");

  // The archive endpoint doesn't include post bodies, so these have to be
  // fetched one at a time
  const items = [];
  for (const post of ownPosts) {
    const item = substackPostToFeedItem(post);
    if (shouldFetchBody(item)) {
      const fullPost = await fetchSubstackJson<SubstackFullPost>(
        `${origin}/api/v1/posts/${encodeURIComponent(post.slug)}`,
      );
      // Paywalled posts have no body, so fall back to the preview text
      item.description = fullPost.body_html || fullPost.truncated_body_text || item.description;
    }
    items.push(item);
  }
  return items;
}

/**
 * Convert a Substack post into the subset of the feedparser item format that
 * we actually use. The guid matches the one in Substack's own RSS feeds, so
 * posts won't be duplicated if a feed is switched between the two.
 */
const substackPostToFeedItem = (post: SubstackArchivePost) => {
  const summary = post.subtitle || post.description || "";
  return {
    guid: post.canonical_url,
    link: post.canonical_url,
    title: post.title,
    pubdate: post.post_date,
    date: post.post_date,
    description: summary,
    summary,
  };
}
