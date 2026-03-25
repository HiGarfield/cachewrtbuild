const core = require("@actions/core");
const { execSync } = require("child_process");
const cache = require("@actions/cache");
const { parseBooleanInput, buildBaseConfig } = require("./utils");

async function fetchCache() {
    try {
        const cleanUpCache = parseBooleanInput(core.getInput("clean"));
        if (cleanUpCache) return;

        const { keyString: baseKey, paths, cacheToolchain, cacheCcache } = buildBaseConfig();
        const skipBuildingToolchain = parseBooleanInput(core.getInput("skip"), true);

        let keyString = baseKey;
        const restoreKeys = [];

        if (cacheCcache) {
            const timestamp = execSync("date +%s").toString().trim();
            restoreKeys.unshift(keyString);
            keyString += `-${timestamp}`;
            paths.push(".ccache");
        }

        if (paths.length === 0) {
            core.debug("No paths configured for caching, skipping");
            return;
        }

        core.debug(`Cache key: ${keyString}`);
        core.debug(`Cache restore keys: ${restoreKeys.join(", ")}`);
        core.debug(`Cache paths: ${paths.join(", ")}`);

        const cacheFetchingResult = await cache.restoreCache(paths, keyString, restoreKeys);

        if (cacheFetchingResult) {
            core.info(`${cacheFetchingResult} cache fetched!`);
            core.setOutput("hit", "1");
            core.saveState("CACHE_STATE", "hit");

            if (cacheToolchain && skipBuildingToolchain) {
                execSync("sed -i 's/ $(tool.*\\/stamp-compile)//;' Makefile");
                execSync("sed -i 's/ $(tool.*\\/stamp-install)//;' Makefile");
                core.info("Toolchain building skipped");
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

fetchCache();