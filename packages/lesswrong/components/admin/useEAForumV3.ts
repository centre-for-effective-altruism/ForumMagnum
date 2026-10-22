import { useCallback } from "react";
import { useCurrentUser } from "../common/withUser";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { userIsAdminOrMod, userIsMemberOf } from "../../lib/vulcan-users/permissions";

const PREFER_NEW_SITE_COOKIE = 'prefer_ea_forum_v3';

/**
 * Hook for managing the EA Forum V3 preference during strangler fig migration.
 * Toggle is shown to admins.
 */
export const useEAForumV3 = (): {
  preferNewSite: boolean;
  setPreferNewSite: (value: boolean) => void;
  showNewSiteToggle: boolean;
} => {
  const currentUser = useCurrentUser();
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent([PREFER_NEW_SITE_COOKIE]);

  const rawCookieValue = cookies[PREFER_NEW_SITE_COOKIE] as
    | string
    | boolean
    | undefined;
  const preferNewSite = rawCookieValue !== "false" && rawCookieValue !== false;
  const showNewSiteToggle = userIsMemberOf(currentUser, "realAdmins") ||
    userIsAdminOrMod(currentUser);

  const setPreferNewSite = useCallback((value: boolean) => {
    if (value) {
      removeCookie(PREFER_NEW_SITE_COOKIE);
    } else {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setCookie(PREFER_NEW_SITE_COOKIE, value ? 'true' : 'false', {
        path: '/',
        expires: oneYearFromNow,
      });
    }
    window.location.reload();
  }, [setCookie, removeCookie]);

  return {
    preferNewSite,
    setPreferNewSite,
    showNewSiteToggle,
  };
};
