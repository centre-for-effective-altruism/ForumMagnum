import { PostHog } from 'posthog-node'
import { DatabaseServerSetting } from '../databaseSettings';
import { isProduction } from '@/lib/executionEnvironment';
import { isBotSiteSetting } from '@/lib/instanceSettings';

export const posthogSettings = new DatabaseServerSetting<{
  host: string,
  projectToken: string,
  apiKey: string,
  projectId: string,
} | null>('posthog', null);

let client: PostHog | null = null;

export const getPosthog = (): PostHog | null => {
  if (!client) {
    const settings = posthogSettings.get();
    if (!settings) {
      // eslint-disable-next-line no-console
      console.warn("Posthog not configured");
      return null;
    }
    client = new PostHog(settings.projectToken, {
      host: settings.host,
    });
    if (!client) {
      // eslint-disable-next-line no-console
      console.error("Failed to create posthog client");
    }
  }
  return client;
}

type RawEvent = {
  type: string,
  timestamp: Date,
  props: Record<string, unknown>,
}

export const writeEventsToPosthog = (events: RawEvent[]) => {
  if (isBotSiteSetting.get()) {
    return;
  }
  for (const { type, timestamp, props } of events) {
    getPosthog()?.capture({
      distinctId: (props.userId || props.clientId) as string,
      event: type,
      timestamp,
      properties: {
        environment: isProduction ? "prod" : "dev",
        repo: "forum-magnum",
        ...props,
      },
    });
  }
}
