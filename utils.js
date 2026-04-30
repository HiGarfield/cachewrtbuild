import * as core from "@actions/core";
import { execSync } from "node:child_process";
import path from "node:path";

export function buildBaseConfig() {
    const prefix = core.getInput("prefix");
    if (prefix) {
        process.chdir(prefix);
        core.debug(`Changed working directory to: ${prefix}`);
    }

    const mixkey = core.getInput("mixkey");
    let keyString = mixkey ? `${mixkey}-cache-openwrt` : "cache-openwrt";
    const paths = [];

    const cacheToolchain = core.getBooleanInput("toolchain");
    if (cacheToolchain) {
        const toolchainHash = execSync('git log --pretty=tformat:"%h" -n1 tools toolchain')
            .toString()
            .trim();
        if (toolchainHash) {
            keyString += `-${toolchainHash}`;
        } else {
            core.warning(
                "Could not determine toolchain hash from git log " +
                "(tools/toolchain may have no commits or the clone may be shallow). " +
                "Cache key will not include a toolchain-specific hash."
            );
        }
        paths.push(
            path.join("staging_dir", "host*"),
            path.join("staging_dir", "tool*")
        );
    }

    const cacheCcache = core.getBooleanInput("ccache");

    const otherPaths = core.getMultilineInput("extra_paths").filter(Boolean);
    if (otherPaths.length > 0) {
        paths.push(...otherPaths);
    }

    return { keyString, paths, cacheToolchain, cacheCcache };
}
