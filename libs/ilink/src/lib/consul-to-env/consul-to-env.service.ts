import { Injectable } from '@nestjs/common';
import Consul from 'consul';
import dotenv from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { getLogger, Logger } from 'log4js';
import { resolve } from 'path';
import { UtilsService } from '../utils/utils.service';
import { ConsulToEnvConfig } from './consul-to-env.config';

@Injectable()
export class ConsulToEnvService {
  public static title = 'consulToEnv';

  private logger!: Logger;

  setLogger(command: string): void {
    this.logger = getLogger(command);
    this.logger.level = UtilsService.logLevel();
  }

  async consulToEnv({
    consulKey,
    consulToken,
    consulDc,
    consulHost,
    consulPort,
    consulSecure,
    clear,
    path,
  }: ConsulToEnvConfig['consulToEnv']) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const envFilePath = resolve(path!);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let envData = existsSync(path!)
        ? dotenv.parse(readFileSync(envFilePath))
        : {};
      this.logger.info(
        'Start save envenvironment variabless from consul to file...'
      );
      this.logger.debug(
        'Options:',
        JSON.stringify({
          consulKey,
          consulDc,
          consulHost,
          consulPort,
          consulSecure,
          clear,
          path,
        })
      );
      const consul = new Consul({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        port: consulPort!.toString(),
        host: consulHost,
        defaults: {
          dc: consulDc,
          token: consulToken,
        },
        secure: consulSecure,
      });
      if (clear) {
        this.logger.debug(`Clear content in file`);
        envData = {};
      }
      const keys = await consul.kv.keys<string[]>(consulKey);
      for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        const key = keys[keyIndex].split(consulKey + '/')[1];
        const value = (
          await consul.kv.get<{ Value: string }>(`${consulKey}/${key}`)
        ).Value;
        try {
          envData[key] = JSON.parse(value);
        } catch (err) {
          envData[key] = value;
        }
      }
      const values: string[] = [];
      const envKeys = Object.keys(envData);
      for (let index = 0; index < envKeys.length; index++) {
        const key = envKeys[index];
        values.push(`${key}=${envData[key]}`);
      }
      writeFileSync(envFilePath, values.join('\n'));
      this.logger.info('End save environment variables from consul to file!');
    } catch (err) {
      this.logger.warn(
        `Error in save environment variables from consul to file`
      );
      this.logger.error(err, err.stack);
      throw err;
    }
  }
}
