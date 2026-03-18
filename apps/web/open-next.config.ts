import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config: OpenNextConfig = {
  default: {
    override: {},
  },
  buildOutputPath: ".",
  appPath: ".",
  packageJsonPath: "../../",
};

export default config;
