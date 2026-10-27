import Cookies from 'universal-cookie';
import { isServer } from './executionEnvironment';

// Strangler Fig Migration Utilities
//
// These utilities help determine whether to use SPA navigation or full page
// navigation based on cookies set by the new site's proxy.
//
// Cookie "prefer_ea_forum_v3": "true" if user has opted into new site

// These take precedence over `newSitePatterns`
const oldSitePatterns = [
  /^\/topics\/(all|create|random|dashboard|wiki)$/, // Special-case topic slugs
];

// Topic pages with these query params use legacy-only workflows (editing,
// viewing revisions, and the tag flag dashboard)
const legacyTopicPageParams = ["edit", "version", "revision", "flagId"];

const newSitePatterns = [
  /^\/$/, // Home page
  /^\/posts\/[^/]+\/[^/]+$/, // Post pages: /posts/[id]/[slug]
  /^\/posts\/[^/]+$/, // Post pages without slug: /posts/[id]
  /^\/s\/[A-Za-z0-9]+\/p\/[A-Za-z0-9]+$/, // Sequence posts
  /^\/(users|user|u)\/[^/]+$/, // User profiles
  /^\/auth\/auth0\/callback-v2$/, // Auth0 callback for new site
  /^\/api\//, // All /api/* routes (unless matched above)
  /^\/rpc\//, // All /rpc/* routes
  /^\/ingest\//, // Posthog ingestion routes
  /^\/monitoring$/, // Sentry ingestion
  /^\/about$/, // About page
  /^\/intro$/, // Intro page
  /^\/moderation$/, // Moderation log page
  /^\/contact$/, // Contact page
  /^\/tags$/, // Topics redirect
  /^\/topics$/, // Topics page
  /^\/topics\/[^/]+$/, // Topic pages: /topics/[slug]
  /^\/(tags|tag|topic)\/[^/]+$/, // Topic pages (legacy paths, redirect to /topics/[slug])
  /^\/copyright$/, // Copyright page
  /^\/cookie-policy$/, // Cookie policy
  /^\/cookiePolicy$/, // Cookie policy (camelCase, redirect to kebab-case)
  /^\/all-posts$/, // All posts page
  /^\/allPosts$/, // All posts page (camelCase, redirect to kebab-case)
  /^\/ban-notice$/, // Ban notice
  /^\/banNotice$/, // Ban notice (camelCase, redirect to kebab-case)
  /^\/terms-of-use$/, // Terms of use
  /^\/termsOfUse$/, // Terms of use (camelCase, redirect to kebab-case)
  /^\/best-of$/, // Best of
  /^\/library$/, // Library
  /^\/sequences$/, // Library (legacy path, redirect to /library)
  /^\/quicktakes$/, // Quick takes page
  /^\/shortform$/, // Quick takes (legacy path, redirect to /quicktakes)
  /^\/admin$/, // Admin
  /^\/admin\/featured$/, // Admin featured queue
  /^\/admin\/onboarding$/, // Admin onboarding test
  /^\/admin\/org-updates-test$/, // Admin org-updates layout test
  /^\/admin\/spotlights.*/, // Admin spotlights pages
  /^\/admin\/swap-user-emails$/, // Admin swap user emails page
  /^\/robots.txt$/, // robots.txt
];

export const isRouteOwnedByEAForumV3 = (href: string): boolean => {
  if (isServer || new Cookies().get("prefer_ea_forum_v3") !== 'true') {
    return false;
  }
  const { pathname, searchParams } = new URL(href, window.location.origin);
  if (oldSitePatterns.some((regex) => regex.test(pathname))) {
    return false;
  }
  if (
    /^\/topics\/[^/]+$/.test(pathname) &&
    legacyTopicPageParams.some((param) => searchParams.has(param))
  ) {
    return false;
  }
  return newSitePatterns.some((regex) => regex.test(href));
}
