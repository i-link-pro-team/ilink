import { Injectable } from '@nestjs/common';
import Consul from 'consul';
import dotenv from 'dotenv';
import { existsSync, lstatSync, readFileSync } from 'fs';
import { getLogger, Logger } from 'log4js';
import { basename, resolve, sep } from 'path';
import recursiveReadDir from 'recursive-readdir';
import sortPaths from 'sort-paths';
import { UtilsService } from '../utils/utils.service';
import { EnvToConsulConfig } from './env-to-consul.config';

@Injectable()
export class EnvToConsulService {
  public static title = 'envToConsul';

  private logger!: Logger;

  setLogger(command: string): void {
    this.logger = getLogger(command);
    this.logger.level = UtilsService.logLevel();
  }

  async envToConsul({
    consulKey,
    consulToken,
    consulDc,
    consulHost,
    consulPort,
    consulSecure,
    consulClear,
    path,
  }: EnvToConsulConfig['envToConsul']) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const sourceFilesPath = existsSync(path!) ? path! : resolve(path!);
      this.logger.info('Start load envs to consul...');
      this.logger.debug(
        'Options:',
        JSON.stringify({
          consulKey,
          consulDc,
          consulHost,
          consulPort,
          consulSecure,
          consulClear,
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
      if (consulClear && consulKey) {
        this.logger.debug(`Clear key: "${consulKey}"`);
        await consul.kv.del({ key: consulKey, recurse: true });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = await new Promise<{ path: string; config: any }[]>(
        (res, rej) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items: { path: string; config: any }[] = [];
          if (!lstatSync(sourceFilesPath).isDirectory()) {
            const config = dotenv.parse(
              readFileSync(sourceFilesPath).toString()
            );
            try {
              const path = basename(sourceFilesPath)
                .split('.')
                .filter((v, i, a) => i < a.length - 1)
                .join('.');
              if (consulKey) {
                this.logger.debug(`Process key: "${consulKey}/${path}"`);
              } else {
                this.logger.debug(`Process key: "${path}"`);
              }
              items.push({ path, config });
              res(items);
            } catch (err) {
              rej(err);
            }
          } else {
            recursiveReadDir(sourceFilesPath, ['!*.env*'], (err, files) => {
              if (err || !Array.isArray(files)) {
                rej(err);
              } else {
                try {
                  files = sortPaths(files, sep);
                  files.forEach((file: string) => {
                    const config = dotenv.parse(readFileSync(file).toString());
                    const path = file
                      .split(`${sourceFilesPath}${sep}`)[1]
                      .split('.')
                      .filter((v, i, a) => i < a.length - 1)
                      .join('.');
                    if (consulKey) {
                      this.logger.debug(`Process key: "${consulKey}/${path}"`);
                    } else {
                      this.logger.debug(`Process key: "${path}"`);
                    }
                    items.push({ path, config });
                  });
                  res(items);
                } catch (err) {
                  rej(err);
                }
              }
            });
          }
        }
      );
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
        const item = items[itemIndex];
        const keys = Object.keys(item.config);
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          const key = keys[keyIndex];
          if (consulKey) {
            await consul.kv.set(
              `${consulKey}/${item.path}/${key}`,
              JSON.stringify(item.config[key])
            );
          } else {
            await consul.kv.set(
              `${item.path}/${key}`,
              JSON.stringify(item.config[key])
            );
          }
        }
      }
      this.logger.info('End load envs to consul!');
    } catch (err) {
      this.logger.warn(`Error in load envs to consul`);
      this.logger.error(err, err.stack);
      throw err;
    }
  }
}
