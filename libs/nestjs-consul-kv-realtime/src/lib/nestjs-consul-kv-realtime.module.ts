import { DynamicModule, Logger, Module } from '@nestjs/common';
import { NestjsConsulKvRealtimeBootstrapService } from './nestjs-consul-kv-realtime-bootstrap.service';
import {
  NestjsConsulKvRealtimeAsyncOptions,
  NestjsConsulKvRealtimeConfigService,
  NestjsConsulKvRealtimeOptions,
  NESTJS_CONSUL_KV_REALTIME_OPTIONS_TOKEN,
} from './nestjs-consul-kv-realtime.config';
import { NestjsConsulKvRealtimeService } from './nestjs-consul-kv-realtime.service';

@Module({
  providers: [
    NestjsConsulKvRealtimeConfigService,
    NestjsConsulKvRealtimeService,
  ],
  exports: [NestjsConsulKvRealtimeConfigService, NestjsConsulKvRealtimeService],
})
class NestjsConsulKvRealtimeModuleCore {}

@Module({
  imports: [NestjsConsulKvRealtimeModuleCore],
  exports: [NestjsConsulKvRealtimeModuleCore],
})
export class NestjsConsulKvRealtimeModule {
  static forRootAsync(
    options: NestjsConsulKvRealtimeAsyncOptions
  ): DynamicModule {
    return {
      module: NestjsConsulKvRealtimeModule,
      imports: options.imports || [],
      providers: [
        {
          provide: NESTJS_CONSUL_KV_REALTIME_OPTIONS_TOKEN,
          useFactory: async (
            nestjsConsulKvRealtimeConfigService: NestjsConsulKvRealtimeConfigService,
            ...args
          ): Promise<void> => {
            const newOptions: NestjsConsulKvRealtimeOptions =
              await options.useFactory(...args);
            Object.assign(nestjsConsulKvRealtimeConfigService, {
              ...newOptions,
              logger:
                newOptions.logger ||
                new Logger(
                  NestjsConsulKvRealtimeModule.name.replace('Module', '')
                ),
              initialized: true,
            });
          },
          inject: [
            NestjsConsulKvRealtimeConfigService,
            ...(options.inject || []),
          ],
        },
        NestjsConsulKvRealtimeBootstrapService,
      ],
    };
  }
}
