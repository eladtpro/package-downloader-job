import { CosmosClientOptions } from '@azure/cosmos';
import { Config } from '@verdaccio/types';
import { config } from 'dotenv';
import { PathLike, readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';
import { join } from 'path';
import { parse, Url } from 'url';

export interface CosmosConfiguration extends CosmosClientOptions {
    database: string;
    container?: string;
}

export interface VerdaccioConfiguration {
    maxUptimeSec: number;
    workingDir: PathLike;
    installTimeout: number;
    serverConfig: Config;
    serverConfigPath: PathLike;
    serverVersion: string;
    serverTitle: string;
    url: Url;
}

export class Configuration {
    private static _current: Configuration;
    private _cosmos!: CosmosConfiguration;
    private _verdaccio!: VerdaccioConfiguration;
    private _downloadLocation!: PathLike;

    static get current(): Configuration {
        if (!Configuration._current)
            throw new Error('configuration uninitialized');

        return Configuration._current;
    }

    get cosmos(): CosmosConfiguration {
        return this._cosmos;
    }

    get verdaccio(): VerdaccioConfiguration {
        return this._verdaccio;
    }

    get downloadLocation(): PathLike {
        return this._downloadLocation;
    }

    static init(): Configuration {
        config();

        const cfg = new Configuration();
        cfg._cosmos = {
            database: process.env.COSMOS_DATABASE!,
            container: process.env.COSMOS_CONTAINER,
            endpoint: process.env.COSMOS_ENDPOINT!,
            key: process.env.COSMOS_KEY
        };

        const path = join(process.cwd(), process.env.VERDACCIO_CONFIG_FILE_NAME!);
        const yamlConfig: Config = safeLoad(readFileSync(path, 'utf8'));
        const yamlUrl: Url = parse(yamlConfig.listen!.toString(), false, true);
        cfg._verdaccio = {
            workingDir: join(process.cwd(), yamlConfig.self_path),
            maxUptimeSec: +process.env.VERDACCIO_MAX_UPTIME_SEC!,
            installTimeout: +process.env.VERDACCIO_INSTALL_TIMEOUT_SEC!,
            serverVersion: '1.0.0',
            serverTitle: 'Verdaccio Orca',
            serverConfigPath: path,
            serverConfig: yamlConfig,
            url: yamlUrl
        };
        cfg._downloadLocation = process.env.DEFAULT_DOWNLOAD_DIRECTORY!;
        Configuration._current = cfg;
        return cfg;
    }
}
