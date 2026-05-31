// .vscode-test.mjs
import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/**/*.test.js",
  version: "1.100.0",
  // ✅ Short path fixes the socket > 103 chars crash
  workspaceFolder: "./test-workspace",
  env: {
    // Forces vscode-test to use a short user-data path
    VSCODE_TEST_USER_DATA_DIR: "/tmp/vscode-test-data",
  },
  launchArgs: [
    "--user-data-dir=/tmp/vscode-test-data", // ✅ Directly caps the socket path
    "--no-sandbox",
  ],
});
