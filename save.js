import * as core from "@actions/core";
import { execSync } from "child_process";
import * as cache from "@actions/cache";
import { parseBooleanInput, buildBaseConfig } from "./utils.js";

async function saveCache() {
    try {
        const cleanUpCache = parseBooleanInput(core.getInput("clean"));
        if (cleanUpCache) {
            core.debug("Cache clean requested, skipping save");
            return;
        }

        const skipSaving = parseBooleanInput(core.getInput("skip_saving"));
        if (skipSaving) {
            core.debug("skip_saving is set, skipping save");
            return;
        }

        const cacheState = core.getState("CACHE_STATE");
        if (cacheState === "hit") {
            core.debug("Cache was already restored, skipping save");
            return;
        }

        const { keyString: baseKey, paths, cacheCcache } = buildBaseConfig();

        let keyString = baseKey;
        if (cacheCcache) {
            const timestamp = execSync("date +%s").toString().trim();
            keyString += `-${timestamp}`;
            paths.push(".ccache");
        }

        if (paths.length === 0) {
            core.debug("No paths configured for caching, skipping");
            return;
        }

        core.debug(`Saving cache with key: ${keyString}`);
        core.debug(`Cache paths: ${paths.join(", ")}`);

        const cacheId = await cache.saveCache(paths, keyString);
        if (cacheId) {
            core.info(`Cache saved with key: ${keyString} (id: ${cacheId})`);
        }
    } catch (error) {
        core.warning(error.message);
    }
}

saveCache();
