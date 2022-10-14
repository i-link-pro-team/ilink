# Console ilink tools

[![npm version](https://badge.fury.io/js/ilink-console-tools.svg)](https://badge.fury.io/js/ilink-console-tools)
[![monthly downloads](https://badgen.net/npm/dm/ilink-console-tools)](https://www.npmjs.com/package/ilink-console-tools)

## Installation

```bash
npm i -g ilink-console-tools
```

## Links

https://github.com/i-link-pro-team/ilink/blob/master/libs/ilink-console-tools/README.md - full readme

## Usage

```bash
# upload from file to consul-kv
ilink-console-tools env-to-consul --path=.env --consul-token=myCustomToken --consul-host=localhost
# download from consul-kv to file
ilink-console-tools consul-to-env --consul-token=myCustomToken --path=.env --consul-host=localhost
```

# NestJS library for work with consul-kv

[![npm version](https://badge.fury.io/js/nestjs-consul-kv-realtime.svg)](https://badge.fury.io/js/nestjs-consul-kv-realtime)
[![monthly downloads](https://badgen.net/npm/dm/nestjs-consul-kv-realtime)](https://www.npmjs.com/package/nestjs-consul-kv-realtime)

## Installation

```bash
npm i --save consul nestjs-consul-kv-realtime
```

## Links

https://github.com/i-link-pro-team/ilink/blob/master/libs/nestjs-consul-kv-realtime/README.md - full readme

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

## License

MIT
