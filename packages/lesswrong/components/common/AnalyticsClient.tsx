import React, {useContext, useEffect} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { clientContextVars, flushClientEvents } from '../../lib/analyticsEvents';
import { useCurrentUser } from './withUser';
import withErrorBoundary from './withErrorBoundary';
import { ABTestGroupsUsedContext } from '../../lib/abTestImpl';
import { CLIENT_ID_COOKIE } from '../../lib/cookies/cookies';
import { useCookiePreferences, useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { isLWorAF } from '../../lib/instanceSettings';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  const abTestGroupsUsed = useContext(ABTestGroupsUsedContext);
  const { cookiePreferences } = useCookiePreferences();
  const analyticsCookiesAllowed = cookiePreferences.includes("analytics");
  
  const currentUserId = currentUser?._id;
  const clientId = cookies[CLIENT_ID_COOKIE];
  useEffect(() => {
    clientContextVars.userId = currentUserId;
    clientContextVars.clientId = clientId;
    clientContextVars.tabId = window.tabId;
    clientContextVars.analyticsCookiesAllowed = analyticsCookiesAllowed;
    if (!isLWorAF) {
      clientContextVars.abTestGroupsUsed = abTestGroupsUsed;
    }
    // There may be events waiting for the client context vars to be set, so flush them now
    flushClientEvents(true);
  }, [currentUserId, clientId, currentUser, abTestGroupsUsed, analyticsCookiesAllowed]);
  
  return <></>;
}

export default registerComponent("AnalyticsClient", AnalyticsClient, {
  hocs: [withErrorBoundary]
});


