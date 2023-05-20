import {
  FactoryProvider,
  Injectable,
  Logger,
  ModuleMetadata,
  OnModuleInit,
} from '@nestjs/common';
import { CommonOptions, ConsulOptions } from 'consul';
import { NestjsConsulKvRealtimeWatcher } from './nestjs-consul-kv-realtime.types';

export const NESTJS_CONSUL_KV_REALTIME_OPTIONS_TOKEN = Symbol(
  'NESTJS_CONSUL_KV_REALTIME_OPTIONS_TOKEN'
);

export type NestjsConsulKvRealtimeOptions = Omit<ConsulOptions, 'promisify'> & {
  watchers?: NestjsConsulKvRealtimeWatcher[];
  logger?: Logger | false;
  useUndefinedValueForErrors?: boolean;
  interval?: number;
};

export interface NestjsConsulKvRealtimeAsyncOptions<
  T extends NestjsConsulKvRealtimeOptions = NestjsConsulKvRealtimeOptions
> {
  useFactory: FactoryProvider<Promise<T>>['useFactory'];
  inject?: FactoryProvider['inject'];
  imports?: ModuleMetadata['imports'];
}

@Injectable()
export class NestjsConsulKvRealtimeConfigService
  implements NestjsConsulKvRealtimeOptions, OnModuleInit
{
  host?: string | undefined;
  port?: string | undefined;
  secure?: boolean | undefined;
  ca?: string[] | undefined;
  defaults?: CommonOptions | undefined;

  watchers: NestjsConsulKvRealtimeWatcher[] = [];
  logger!: Logger | false;
  useUndefinedValueForErrors?: boolean;
  interval?: number;

  initialized = false;

  onModuleInit(): void {
    if (!this.initialized) {
      throw new Error(
        `${NestjsConsulKvRealtimeConfigService.name} not initialized`
      );
    }
  }

  getLogger() {
    if (this.logger) {
      return this.logger;
    }
    return undefined;
  }
}
