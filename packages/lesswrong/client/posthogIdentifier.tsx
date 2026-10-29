import { useEffect } from "react";
import { usePostHog } from "@posthog/react";
import { useClientId } from "@/lib/abTestImpl";
import { useQueryCurrentUser } from "@/lib/crud/withCurrentUser";
import { useCookiePreferences } from "@/components/hooks/useCookiesWithConsent";

export const PosthogIdentifier = () => {
  const posthog = usePostHog();
  // This is rendered outside of `UserContext`, so we can't use `useCurrentUser`
  const { currentUser, currentUserLoading } = useQueryCurrentUser();
  const clientId = useClientId();
  const { cookiePreferences } = useCookiePreferences();
  const analyticsAllowed = cookiePreferences.includes("analytics");

  useEffect(() => {
    if (currentUserLoading) {
      return;
    }

    if (!analyticsAllowed) {
      // With `cookieless_mode: "on_reject"` this switches to cookieless
      // anonymous capture
      if (posthog.get_explicit_consent_status() !== "denied") {
        posthog.opt_out_capturing();
      }
      return;
    }

    // Logged out visitors should be anonymous with `clientId` as their distinct
    // id, so that their events match the server-side events for the same
    // client, and so that they get merged into their user when they log in
    // (`identify` only merges when the current distinct id is anonymous). If
    // they're "identified" it means that they logged out without resetting.
    // Note that `reset` clears the stored consent, so we must do this before
    // opting in.
    const needsReset = !currentUser && clientId && (
      posthog.get_distinct_id() !== clientId ||
      posthog.get_property("$user_state") === "identified"
    );
    if (needsReset) {
      posthog.reset({ bootstrap: { distinctID: clientId } });
    }

    if (posthog.get_explicit_consent_status() !== "granted") {
      posthog.opt_in_capturing({ captureEventName: false });
    }

    if (currentUser) {
      posthog.identify(currentUser._id, {
        email: currentUser.email ?? undefined,
        username: currentUser.username ?? currentUser.displayName ?? undefined,
        clientId,
      });
    }
  }, [posthog, currentUser, currentUserLoading, clientId, analyticsAllowed]);

  return null;
}
