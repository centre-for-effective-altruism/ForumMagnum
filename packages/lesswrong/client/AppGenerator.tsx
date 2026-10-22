// Client-side React wrapper/context provider
import React, { useEffect, useState, useTransition } from 'react';
import { ApolloProvider } from '@apollo/client';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { PrefersDarkModeProvider } from '../components/themes/usePrefersDarkMode';
import CookiesProvider from "@/lib/vendor/react-cookie/CookiesProvider";
// eslint-disable-next-line no-restricted-imports
import { BrowserRouter } from 'react-router-dom';
import { ABTestGroupsUsedContext, RelevantTestGroupAllocation } from '../lib/abTestImpl';
import type { AbstractThemeOptions } from '../themes/themeNames';
import { LayoutOptionsContextProvider } from '../components/hooks/useLayoutOptions';
import { SSRMetadata, EnvironmentOverride, EnvironmentOverrideContext } from '../lib/utils/timeUtil';
import { ThemeContextProvider } from '@/components/themes/useTheme';
import AppComponent from '../components/vulcan-core/App';
import posthog from 'posthog-js'; 
import { PostHogProvider } from '@posthog/react' 
import { isProduction } from '@/lib/executionEnvironment';
import { DatabasePublicSetting } from "@/lib/publicSettings";
import { PosthogIdentifier } from './posthogIdentifier';
import { isBotSiteSetting } from '@/lib/instanceSettings';

const posthogProjectToken = new DatabasePublicSetting("posthogProjectToken", "");

if (!isBotSiteSetting.get()) {
  posthog.init(posthogProjectToken.get(), {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    capture_exceptions: true,
    persistence: "localStorage+cookie",
    cookieless_mode: 'on_reject',
    loaded: (ph) => {
      ph.register({
        environment: isProduction ? "prod" : "dev",
        repo: "forum-magnum",
      });
    },
    // Set this to true to enable verbose posthog logs in the console
    debug: false,
  });
}

// Client-side wrapper around the app. There's another AppGenerator which is
// the server-side version, which differs in how it sets up the wrappers for
// routing and cookies and such.
const AppGenerator = ({ apolloClient, abTestGroupsUsed, themeOptions, ssrMetadata }: {
  apolloClient: ApolloClient<NormalizedCacheObject>,
  abTestGroupsUsed: RelevantTestGroupAllocation,
  themeOptions: AbstractThemeOptions,
  ssrMetadata?: SSRMetadata,
}) => {
  return (
    <PostHogProvider client={posthog}> 
      <ApolloProvider client={apolloClient}>
        <CookiesProvider>
          <ThemeContextProvider options={themeOptions}>
          <BrowserRouter>
            <ABTestGroupsUsedContext.Provider value={abTestGroupsUsed}>
              <PrefersDarkModeProvider>
                <LayoutOptionsContextProvider>
                  <EnvironmentOverrideContextProvider ssrMetadata={ssrMetadata}>
                    <PosthogIdentifier />
                    <AppComponent apolloClient={apolloClient} />
                  </EnvironmentOverrideContextProvider>
                </LayoutOptionsContextProvider>
              </PrefersDarkModeProvider>
            </ABTestGroupsUsedContext.Provider>
          </BrowserRouter>
          </ThemeContextProvider>
        </CookiesProvider>
      </ApolloProvider>
    </PostHogProvider>
  );
};

const EnvironmentOverrideContextProvider = ({ssrMetadata, children}: {
  ssrMetadata?: SSRMetadata
  children: React.ReactNode
}) => {
  const [envOverride, setEnvOverride] = useState<EnvironmentOverride>(ssrMetadata ? {
    ...ssrMetadata,
    matchSSR: true
  } : { matchSSR: false });
  const [_isPending, startTransition] = useTransition();

  useEffect(() => {
    if (envOverride.matchSSR === false) return;

    startTransition(() => {
      setEnvOverride({matchSSR: false});
    });

  }, [envOverride.matchSSR]);

  return <EnvironmentOverrideContext.Provider value={envOverride}>
    {children}
  </EnvironmentOverrideContext.Provider>
}

export default AppGenerator;
