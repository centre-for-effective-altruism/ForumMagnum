import config from "./jest.config";

const base = "packages/lesswrong/integrationTests";

export default {
  ...config,
  testMatch: [
    `<rootDir>/${base}/**/?(*.)+(spec|test|tests).[tj]s?(x)`,
  ],
  setupFiles: [
    `<rootDir>/${base}/testPreSetup.ts`,
  ],
  globals: {
    ...config.globals,
    bundleIsIntegrationTest: true,
  },
};
