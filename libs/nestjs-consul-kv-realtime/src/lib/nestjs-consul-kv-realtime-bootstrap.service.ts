import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NestjsConsulKvRealtimeConfigService } from './nestjs-consul-kv-realtime.config';
import { addAllFirstValuesForDecoratedFields } from './nestjs-consul-kv-realtime.decorators';
import { NestjsConsulKvRealtimeService } from './nestjs-consul-kv-realtime.service';

@Injectable()
export class NestjsConsulKvRealtimeBootstrapService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly nestjsConsulKvRealtimeService: NestjsConsulKvRealtimeService,
    private readonly nestjsConsulKvRealtimeConfigService: NestjsConsulKvRealtimeConfigService
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onModuleDestroy(signal?: string | undefined) {
    try {
      this.nestjsConsulKvRealtimeService.removeAllWatchers();
    } catch (err) {
      this.nestjsConsulKvRealtimeConfigService
        .getLogger()
        ?.error(err, err.stack);
      if (
        !this.nestjsConsulKvRealtimeConfigService.useUndefinedValueForErrors
      ) {
        throw err;
      }
    }
  }

  async onModuleInit() {
    try {
      await this.nestjsConsulKvRealtimeService.addAllWatchers();
      await addAllFirstValuesForDecoratedFields();
    } catch (err) {
      this.nestjsConsulKvRealtimeConfigService
        .getLogger()
        ?.error(err, err.stack);
      if (
        !this.nestjsConsulKvRealtimeConfigService.useUndefinedValueForErrors
      ) {
        throw err;
      }
    }
  }
}
