import { PostHog } from 'posthog-node'
import { DatabaseServerSetting } from '../databaseSettings';

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
      return null;
    }
    client = new PostHog(settings.projectToken, {
      host: settings.host,
    });
  }
  return client;
}

type RawEvent = {
  type: string,
  timestamp: Date,
  props: Record<string, unknown>,
}

export const writeEventsToPosthog = (events: RawEvent[]) => {
  for (const { type, timestamp, props } of events) {
    getPosthog()?.capture({
      distinctId: (props.userId || props.clientId || "anonymous") as string,
      event: type,
      timestamp,
      properties: props,
    });
  }
}
