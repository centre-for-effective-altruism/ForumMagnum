import { PostHog } from 'posthog-node'
import { DatabaseServerSetting } from '../databaseSettings';
import { isBotSiteSetting } from '@/lib/instanceSettings';
import { getPosthogEnvironment } from '@/lib/posthogUtils';
import { randomId } from '@/lib/random';

export const posthogSettings = new DatabaseServerSetting<{
  host: string,
  projectToken: string,
  apiKey: string,
  projectId: string,
} | null>('posthog', null);

const SHUTDOWN_FLUSH_TIMEOUT_MS = 3000;

let client: PostHog | null = null;

/**
 * posthog-node batches events in memory, so flush them before the process
 * exits. The handlers are registered with `once` so re-raising the signal
 * afterwards falls through to Node's default behaviour (terminating).
 */
const flushPosthogOnExit = () => {
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void (client?.shutdown(SHUTDOWN_FLUSH_TIMEOUT_MS) ?? Promise.resolve())
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error("Failed to flush posthog events", e);
        })
        .finally(() => process.kill(process.pid, signal));
    });
  }
}

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
    flushPosthogOnExit();
  }
  return client;
}

type RawEvent = {
  type: string,
  timestamp: Date,
  props: Record<string, unknown>,
}

/**
 * Events relayed from the client are only linked to a user/client if the user
 * has allowed analytics cookies - otherwise they're sent as anonymous events
 * with no person profile. Server-originated events without a user or client
 * are also sent without a person profile.
 */
const getEventIdentity = (
  props: Record<string, unknown>,
  source: "client" | "server",
): {distinctId: string, properties: Record<string, unknown>} => {
  if (source === "client" && props.analyticsCookiesAllowed !== true) {
    const { userId: _userId, clientId: _clientId, ...rest } = props;
    return {
      distinctId: randomId(),
      properties: { ...rest, $process_person_profile: false },
    };
  }
  const distinctId = props.userId || props.clientId;
  if (typeof distinctId === "string" && distinctId) {
    return { distinctId, properties: props };
  }
  return {
    distinctId: "forum-magnum-server",
    properties: { ...props, $process_person_profile: false },
  };
}

export const writeEventsToPosthog = (events: RawEvent[], source: "client" | "server") => {
  if (isBotSiteSetting.get()) {
    return;
  }
  const posthog = getPosthog();
  if (!posthog) {
    return;
  }
  const environment = getPosthogEnvironment();
  for (const { type, timestamp, props } of events) {
    const { distinctId, properties } = getEventIdentity(props, source);
    posthog.capture({
      distinctId,
      event: type,
      timestamp,
      properties: {
        environment,
        repo: "forum-magnum",
        ...properties,
      },
    });
  }
}
