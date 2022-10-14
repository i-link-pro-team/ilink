[![npm version](https://badge.fury.io/js/nestjs-consul-kv-realtime.svg)](https://badge.fury.io/js/nestjs-consul-kv-realtime)
[![monthly downloads](https://badgen.net/npm/dm/nestjs-consul-kv-realtime)](https://www.npmjs.com/package/nestjs-consul-kv-realtime)

## Installation

```bash
npm i --save consul nestjs-consul-kv-realtime
```

## Links

https://www.npmjs.com/package/ilink-console-tools - Console tools with method for save .env file to consul-kv and method for download from consul-kv to .env file.

https://github.com/i-link-pro-team/ilink/blob/develop/libs/nestjs-consul-kv-realtime/tests/e2e/nestjs-consul-kv-realtime.spec.ts - Tests for all exists feature of library.

## Usage

### Simple usage with global watchers for consul-kv

```typescript
import { Module } from '@nestjs/common';
import { NestjsConsulKvRealtimeModule } from 'nestjs-consul-kv-realtime';

@Module({
  imports: [
    NestjsConsulKvRealtimeModule.forRootAsync({
      useFactory: async () => ({
        port: '8500',
        host: 'localhost',
        defaults: {
          token: `CONSUL_HTTP_TOKEN`,
        },
        watchers: [
          {
            interval: 1000,
            key: 'consul-key',
            callback: async (value: { key: string }) => {
              console.log('New value from consul:', value);
            },
          },
        ],
      }),
    }),
  ],
})
export class AppModule {}
```

### Get value from consul-kv with service

```typescript
import { Injectable } from '@nestjs/common';
import { NestjsConsulKvRealtimeService } from 'nestjs-consul-kv-realtime';

@Injectable()
export class MyService {
  constructor(
    private readonly nestjsConsulKvRealtimeService: NestjsConsulKvRealtimeService
  ) {}
  async method() {
    const value = await this.nestjsConsulKvRealtimeService.getValue(
      'consul-key'
    );
    console.log('Value from consul:', value);
    return value;
  }
}
```

### Listen changes from consul-kv

```typescript
import { Controller, Get } from '@nestjs/common';
import { NestjsConsulKvRealtimeService } from 'nestjs-consul-kv-realtime';
import { tap } from 'rxjs/operators';

@Controller()
export class MyController {
  constructor(
    private readonly nestjsConsulKvRealtimeService: NestjsConsulKvRealtimeService
  ) {}

  @Get()
  getConsulValue() {
    return this.nestjsConsulKvRealtimeService
      .listen({ key: 'consul-key' })
      .pipe(tap((value) => console.log('New value from consul:', value)));
  }
}
```

### Use decorator for get consul-kv value

```typescript
import { Injectable } from '@nestjs/common';
import { ConsulKeyValue } from 'nestjs-consul-kv-realtime';

@Injectable()
export class MyService {
  @ConsulKeyValue({
    key: 'consul-key',
  })
  value!: { key: string };

  async method() {
    console.log('Value from consul:', this.value);
    return this.value;
  }
}
```

### Use decorator with factory for create custom object from consul-kv value

```typescript
import { Injectable } from '@nestjs/common';
import { ConsulKeyValue } from 'nestjs-consul-kv-realtime';

class ExternalLibrary {
  public options?: { key1: string };
  private connected = false;

  async connect(options: { key1: string }) {
    this.options = options;
    this.connected = true;
  }

  async waitEndOfAllCurrentOperations() {
    return true;
  }

  async disconnect() {
    this.connected = false;
  }

  async isConnected() {
    return this.connected === true;
  }
}

@Injectable()
export class MyService {
  @ConsulKeyValue({
    interval: 500,
    key: 'file',
    factory: async (
      newConsulValue: { key1: string },
      oldValue?: ExternalLibrary
    ) => {
      if (oldValue) {
        await oldValue.waitEndOfAllCurrentOperations();
        await oldValue.disconnect();
      }
      const externalLibrary = new ExternalLibrary();
      await externalLibrary.connect(newConsulValue);
      return externalLibrary;
    },
  })
  externalLibrary!: ExternalLibrary;

  async isConnected() {
    const isConnected = this.externalLibrary.isConnected();
    console.log('Connection state:', isConnected);
    return isConnected;
  }
}
```

## License

MIT
