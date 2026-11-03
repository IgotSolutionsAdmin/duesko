import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    viewport: { width: 390, height: 844 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "app",
      testIgnore: [
        "**/test-site.spec.ts",
        "**/test-site-off.spec.ts",
        "**/day6-screens.spec.ts",
        "**/uma-review-3-screens.spec.ts",
        "**/uma-review-4-screens.spec.ts",
      ],
      use: { baseURL: "http://127.0.0.1:43117" },
    },
    {
      name: "screens",
      testMatch: [
        "**/day6-screens.spec.ts",
        "**/uma-review-3-screens.spec.ts",
        "**/uma-review-4-screens.spec.ts",
      ],
      use: { baseURL: "http://127.0.0.1:43119" },
    },
    {
      name: "test-site",
      testMatch: "**/test-site.spec.ts",
      use: { baseURL: "http://127.0.0.1:43118" },
    },
    {
      name: "test-site-off",
      testMatch: "**/test-site-off.spec.ts",
      use: { baseURL: "http://127.0.0.1:43120" },
    },
  ],
  webServer: [
    {
      command: "NEXT_PUBLIC_DUESKO_TEST_SITE=true npm run dev",
      url: "http://127.0.0.1:43117",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        "NEXT_PUBLIC_DUESKO_TEST_SITE=true NEXT_DIST_DIR=.next-test-site npx next build && NEXT_PUBLIC_DUESKO_TEST_SITE=true NEXT_DIST_DIR=.next-test-site npx next start --hostname 0.0.0.0 --port 43118",
      url: "http://127.0.0.1:43118",
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command:
        "DUESKO_E2E=1 NEXT_PUBLIC_DUESKO_TEST_SITE=true NEXT_DIST_DIR=.next-screens npx next build && DUESKO_E2E=1 NEXT_PUBLIC_DUESKO_TEST_SITE=true NEXT_DIST_DIR=.next-screens npx next start --hostname 0.0.0.0 --port 43119",
      url: "http://127.0.0.1:43119",
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command:
        "env -u NEXT_PUBLIC_DUESKO_TEST_SITE NEXT_DIST_DIR=.next-off npx next build && env -u NEXT_PUBLIC_DUESKO_TEST_SITE NEXT_DIST_DIR=.next-off npx next start --hostname 0.0.0.0 --port 43120",
      url: "http://127.0.0.1:43120",
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
