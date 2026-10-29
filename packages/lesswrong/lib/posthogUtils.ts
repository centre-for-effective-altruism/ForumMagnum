import { isDevelopment } from './executionEnvironment';
import { environmentDescriptionSetting } from './instanceSettings';

/**
 * The `environment` property attached to every PostHog event. Production is
 * reported as "prod" and local development as "dev" to match historical data;
 * other deployments (e.g. "staging") use their `analytics.environment` value.
 */
export const getPosthogEnvironment = (): string => {
  if (isDevelopment) {
    return "dev";
  }
  const environment = environmentDescriptionSetting.get();
  return environment === "production" ? "prod" : environment;
}
