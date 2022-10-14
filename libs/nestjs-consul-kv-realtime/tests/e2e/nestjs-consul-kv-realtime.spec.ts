import { Injectable, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Consul from 'consul';
import execa from 'execa';
import { join } from 'path';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import {
  ConsulKeyValue,
  NestjsConsulKvRealtimeModule,
  NestjsConsulKvRealtimeService,
} from '../../src';

describe('NestjsConsulKvRealtime (e2e)', () => {
  jest.setTimeout(5 * 60 * 1000);
  let container: StartedTestContainer;
  const CONSUL_HTTP_TOKEN = 'd8b99749-09dc-41bc-b05c-3d97062db228';

  beforeAll(async () => {
    container = await new GenericContainer('bitnami/consul:latest')
      .withExposedPorts(
        { host: 8300, container: 8300 },
        { host: 8301, container: 8301 },
        { host: 8301, container: 8301 },
        { host: 8500, container: 8500 },
        { host: 8600, container: 8600 },
        { host: 8600, container: 8600 }
      )
      .withEnv('CONSUL_HTTP_TOKEN', CONSUL_HTTP_TOKEN)
      .start();

    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);
  });

  afterAll(async () => {
    await container.stop();
  });

  it('direct get value from consul', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    const value = await nestjsConsulKvRealtimeService.getValue('file');

    expect(value).toEqual({ key1: 'value2' });

    await app.close();
  });

  it('listen changes with watchers', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    let valueFromWatcher: { key1: string } | undefined = undefined;
    let consulFromWatcher: Consul.Consul | undefined = undefined;
    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 1000,
                key: 'file',
                callback: async (
                  value: { key1: string },
                  consul: Consul.Consul
                ) => {
                  consulFromWatcher = consul;
                  valueFromWatcher = value;
                },
              },
            ],
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    expect(consulFromWatcher).not.toBeUndefined();

    // check loaded envs at start
    expect(valueFromWatcher).toEqual({ key1: 'value2' });

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // check updated values
    expect(valueFromWatcher).toEqual({ key1: 'value3' });

    await app.close();
  });

  it('manual add watchers and listen changes', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    let valueFromWatcher: { key1: string } | undefined = undefined;
    let consulFromWatcher: Consul.Consul | undefined = undefined;
    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    expect(consulFromWatcher).toBeUndefined();

    // check data without watchers
    expect(valueFromWatcher).toEqual(undefined);

    await nestjsConsulKvRealtimeService.addWatcher({
      interval: 1000,
      key: 'file',
      callback: async (value: { key1: string }, consul: Consul.Consul) => {
        consulFromWatcher = consul;
        valueFromWatcher = value;
      },
    });

    expect(consulFromWatcher).not.toBeUndefined();

    // check loaded envs after add watcher
    expect(valueFromWatcher).toEqual({ key1: 'value2' });

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // check updated values
    expect(valueFromWatcher).toEqual({ key1: 'value3' });

    await app.close();
  });

  it('check usage custom logger', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errFromWatcher: any = undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stackFromWatcher: any = undefined;

    class CustomErrror extends Error {}

    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 1000,
                key: 'file',
                callback: async () => {
                  throw new CustomErrror();
                },
              },
            ],
            logger: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              error: (err: any, stack: any) => {
                errFromWatcher = err;
                stackFromWatcher = stack;
              },
            } as Logger,
          }),
        }),
      ],
    }).compile();

    const app = module.createNestApplication();
    try {
      await app.init();
    } catch (err) {
      expect(err instanceof CustomErrror).toBeTruthy();

      expect(errFromWatcher).toBeUndefined();
      expect(stackFromWatcher).toBeUndefined();
    }

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    expect(errFromWatcher).toBeTruthy();
    expect(stackFromWatcher).not.toBeUndefined();

    await app.close();
  });

  it('ignore start run watchers if value not changed', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    let valueFromWatcher: { key1: string } | undefined = undefined;
    let countFromWatchers = 0;
    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 500,
                key: 'file',
                callback: async (value: { key1: string }) => {
                  valueFromWatcher = value;
                  countFromWatchers++;
                },
              },
            ],
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    // check loaded envs at start
    expect(valueFromWatcher).toEqual({ key1: 'value2' });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(countFromWatchers).toEqual(1);

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(countFromWatchers).toEqual(2);

    // check updated values
    expect(valueFromWatcher).toEqual({ key1: 'value3' });

    await app.close();
  });

  it('ignore start run watchers if value not changed when we subscribe to changes over rxjs', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    let valueFromWatcher: { key1: string } | undefined = undefined;
    let countFromWatchers = 0;
    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
          }),
        }),
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    const subscription: Subscription = nestjsConsulKvRealtimeService
      .listen<{ key1: string }>({ key: 'file', value: 500 })
      .pipe(
        tap((value) => {
          valueFromWatcher = value;
          countFromWatchers++;
        })
      )
      .subscribe();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // check loaded envs at start
    expect(valueFromWatcher).toEqual({ key1: 'value2' });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(countFromWatchers).toEqual(1);

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(countFromWatchers).toEqual(2);

    // check updated values
    expect(valueFromWatcher).toEqual({ key1: 'value3' });

    // unsubscribe and try change value
    subscription.unsubscribe();

    await nestjsConsulKvRealtimeService.set('file/key1', '"value4"');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    expect(countFromWatchers).toEqual(2);

    // check updated values
    expect(valueFromWatcher).toEqual({ key1: 'value3' });

    await app.close();
  });

  it('use decorator for static retrieve value by consul key', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    @Injectable()
    class RetrieveWithDecoratorService {
      @ConsulKeyValue({
        interval: 500,
        key: 'file',
      })
      consulKeyValue?: { key1: string };
    }

    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 500,
                key: 'file',
              },
            ],
          }),
        }),
      ],
      providers: [RetrieveWithDecoratorService],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    const retrieveWithDecoratorService = app.get<RetrieveWithDecoratorService>(
      RetrieveWithDecoratorService
    );

    expect(retrieveWithDecoratorService.consulKeyValue).toEqual({
      key1: 'value2',
    });

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(retrieveWithDecoratorService.consulKeyValue).toEqual({
      key1: 'value3',
    });

    await app.close();
  });

  it('use decorator with stream options for retrieve value by consul key', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    @Injectable()
    class RetrieveWithDecoratorService {
      @ConsulKeyValue({
        interval: 500,
        key: 'file',
        stream: true,
      })
      consulKeyValue$?: Observable<{ key1: string }>;
    }

    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 500,
                key: 'file',
              },
            ],
          }),
        }),
      ],
      providers: [RetrieveWithDecoratorService],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    const retrieveWithDecoratorService = app.get<RetrieveWithDecoratorService>(
      RetrieveWithDecoratorService
    );

    let consulKeyValue1: { key1: string } | undefined;
    let consulKeyValue2: { key1: string } | undefined;

    retrieveWithDecoratorService.consulKeyValue$?.subscribe(
      (value) => (consulKeyValue1 = value)
    );
    retrieveWithDecoratorService.consulKeyValue$?.subscribe(
      (value) => (consulKeyValue2 = value)
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(consulKeyValue1).toEqual({
      key1: 'value2',
    });
    expect(consulKeyValue2).toEqual({
      key1: 'value2',
    });

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(consulKeyValue1).toEqual({
      key1: 'value3',
    });
    expect(consulKeyValue2).toEqual({
      key1: 'value3',
    });

    await app.close();
  });

  it('use decorator with factory options for retrieve value by consul key and connect/disconnect to external library', async () => {
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

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
    class RetrieveWithDecoratorService {
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
    }

    const module = await Test.createTestingModule({
      imports: [
        NestjsConsulKvRealtimeModule.forRootAsync({
          useFactory: async () => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            port: container.getMappedPort(8500).toString(),
            host: container.getHost(),
            defaults: {
              token: CONSUL_HTTP_TOKEN,
            },
            watchers: [
              {
                interval: 500,
                key: 'file',
              },
            ],
          }),
        }),
      ],
      providers: [RetrieveWithDecoratorService],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const nestjsConsulKvRealtimeService =
      app.get<NestjsConsulKvRealtimeService>(NestjsConsulKvRealtimeService);

    const retrieveWithDecoratorService = app.get<RetrieveWithDecoratorService>(
      RetrieveWithDecoratorService
    );

    const isConnected =
      await retrieveWithDecoratorService.externalLibrary.isConnected();

    expect(isConnected).toEqual(true);

    expect(retrieveWithDecoratorService.externalLibrary.options).toEqual({
      key1: 'value2',
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await nestjsConsulKvRealtimeService.set('file/key1', '"value3"');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(retrieveWithDecoratorService.externalLibrary.options).toEqual({
      key1: 'value3',
    });

    await app.close();
  });
});
