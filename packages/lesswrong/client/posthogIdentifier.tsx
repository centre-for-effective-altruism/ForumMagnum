import { useEffect } from "react";
import { usePostHog } from "@posthog/react";
import { useClientId } from "@/lib/abTestImpl";
import { useCurrentUser } from "@/components/common/withUser";
import { useCookiePreferences } from "@/components/hooks/useCookiesWithConsent";

export const PosthogIdentifier = () => {
  const posthog = usePostHog();
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const preferences = useCookiePreferences();

  useEffect(() => {
    if (preferences.explicitConsentGiven || !preferences.explicitConsentRequired) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
  }, [posthog, preferences, currentUser]);

  useEffect(() => {
    if (currentUser) {
      posthog.identify(currentUser._id, {
        email: currentUser.email ?? undefined,
        username: currentUser.username ?? currentUser.displayName ?? undefined,
        clientId,
      });
    } else if (clientId) {
      posthog.identify(clientId, { clientId });
    }
  }, [posthog, currentUser, clientId]);

  return null;
}
