import { Command, Console } from 'nestjs-console';
import { UtilsService } from '../utils/utils.service';
import {
  DEFAULT_CONSUL_TO_ENV_CONFIG,
  ConsulToEnvConfig,
} from './consul-to-env.config';
import { ConsulToEnvService } from './consul-to-env.service';

@Console()
export class ConsulToEnvCommands {
  private readonly consulToEnvConfig = this.utilsService.getIlinkConfig(
    DEFAULT_CONSUL_TO_ENV_CONFIG
  ).consulToEnv;

  constructor(
    private readonly consulToEnvService: ConsulToEnvService,
    private readonly utilsService: UtilsService
  ) {}

  @Command({
    command: 'consul-to-env',
    description: 'Save environment variables from consul to .env file',
    options: [
      {
        flags: '-f,--path [string]',
        description: `path to file with .env for save or update variables (default: ${DEFAULT_CONSUL_TO_ENV_CONFIG.consulToEnv.path})`,
      },
      {
        flags: '-c,--clear [boolean]',
        description:
          'clear .env file before save environment variables from consul (default: false)',
      },
      {
        flags: '-q,--singleQuote [boolean]',
        description: 'use single quote when writing to file (default: false)',
      },
      {
        flags: '-x,--trimPaths [boolean]',
        description:
          'remove paths is key names exported from consul (default: false)',
      },
      {
        flags: '-h,--consul-host [string]',
        description: `host of consul server (default: ${DEFAULT_CONSUL_TO_ENV_CONFIG.consulToEnv.consulHost})`,
      },
      {
        flags: '-p,--consul-port [string]',
        description: `port of consul server (default: ${DEFAULT_CONSUL_TO_ENV_CONFIG.consulToEnv.consulPort})`,
      },
      {
        flags: '-k,--consul-key [string]',
        description: `key in consul for retrieve environment variables`,
      },
      {
        flags: '-t,--consul-token [string]',
        description: `token for work with consul server`,
        required: true,
      },
      {
        flags: '-d,--consul-dc [string]',
        description: `dc of consul server`,
      },
      {
        flags: '-s,--consul-secure [boolean]',
        description: 'work in secure mode (default: false)',
      },
    ],
  })
  async consulToEnv({
    path,
    consulHost,
    consulPort,
    consulKey,
    consulToken,
    clear,
    trimPaths,
    singleQuote,
    consulDc,
    consulSecure,
  }: ConsulToEnvConfig['consulToEnv']) {
    this.consulToEnvService.setLogger(ConsulToEnvService.title);
    await this.consulToEnvService.consulToEnv({
      consulKey,
      consulToken,
      clear: clear || this.consulToEnvConfig.clear,
      trimPaths: trimPaths || this.consulToEnvConfig.trimPaths,
      singleQuote: singleQuote || this.consulToEnvConfig.singleQuote,
      consulDc: consulDc,
      consulHost: consulHost || this.consulToEnvConfig.consulHost,
      consulPort: consulPort || this.consulToEnvConfig.consulPort,
      consulSecure: consulSecure || this.consulToEnvConfig.consulSecure,
      path,
    });
  }
}
