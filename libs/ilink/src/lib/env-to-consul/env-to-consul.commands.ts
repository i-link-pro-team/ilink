import { Command, Console } from 'nestjs-console';
import { UtilsService } from '../utils/utils.service';
import {
  DEFAULT_ENV_TO_CONSUL_CONFIG,
  EnvToConsulConfig,
} from './env-to-consul.config';
import { EnvToConsulService } from './env-to-consul.service';

@Console()
export class EnvToConsulCommands {
  private readonly envToConsulConfig = this.utilsService.getIlinkConfig(
    DEFAULT_ENV_TO_CONSUL_CONFIG
  ).envToConsul;

  constructor(
    private readonly envToConsulService: EnvToConsulService,
    private readonly utilsService: UtilsService
  ) {}

  @Command({
    command: 'env-to-consul',
    description: 'Copy content of .env file(s) to consul',
    options: [
      {
        flags: '-f,--path [string]',
        description: `path to file with .env variables or path to folder with many .env files (default: ${DEFAULT_ENV_TO_CONSUL_CONFIG.envToConsul.path})`,
      },
      {
        flags: '-h,--consul-host [string]',
        description: `host of consul server (default: ${DEFAULT_ENV_TO_CONSUL_CONFIG.envToConsul.consulHost})`,
      },
      {
        flags: '-p,--consul-port [string]',
        description: `port of consul server (default: ${DEFAULT_ENV_TO_CONSUL_CONFIG.envToConsul.consulPort})`,
      },
      {
        flags: '-k,--consul-key [string]',
        description: `root key to append .env file(s)`,
      },
      {
        flags: '-t,--consul-token [string]',
        description: `token for work with consul server`,
        required: true,
      },
      {
        flags: '-c,--consul-clear [boolean]',
        description:
          'clear all values and sub values in consul key (default: false)',
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
  async envToConsul({
    path,
    consulHost,
    consulPort,
    consulKey,
    consulToken,
    consulClear,
    consulDc,
    consulSecure,
  }: EnvToConsulConfig['envToConsul']) {
    this.envToConsulService.setLogger(EnvToConsulService.title);
    await this.envToConsulService.envToConsul({
      consulKey,
      consulToken,
      consulClear: consulClear || this.envToConsulConfig.consulClear,
      consulDc: consulDc,
      consulHost: consulHost || this.envToConsulConfig.consulHost,
      consulPort: consulPort || this.envToConsulConfig.consulPort,
      consulSecure: consulSecure || this.envToConsulConfig.consulSecure,
      path,
    });
  }
}
