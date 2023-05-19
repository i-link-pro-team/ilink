import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Consul from 'consul';
import { NestjsConsulKvRealtimeConfigService } from './nestjs-consul-kv-realtime.config';
import { addAllFirstValuesForDecoratedFields } from './nestjs-consul-kv-realtime.decorators';
import { NestjsConsulKvRealtimeService } from './nestjs-consul-kv-realtime.service';

@Injectable()
export class NestjsConsulKvRealtimeBootstrapService
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly nestjsConsulKvRealtimeConfigService: NestjsConsulKvRealtimeConfigService,
    private readonly nestjsConsulKvRealtimeService: NestjsConsulKvRealtimeService
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onModuleDestroy(signal?: string | undefined) {
    this.nestjsConsulKvRealtimeService.removeAllWatchers();
  }

  async onModuleInit() {
    Object.assign(
      this.nestjsConsulKvRealtimeService,
      new Consul(this.nestjsConsulKvRealtimeConfigService).kv
    );
    await this.nestjsConsulKvRealtimeService.addAllWatchers();
    await addAllFirstValuesForDecoratedFields();
  }
}
