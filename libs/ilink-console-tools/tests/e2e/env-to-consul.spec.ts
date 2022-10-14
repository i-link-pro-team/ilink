import Consul from 'consul';
import execa from 'execa';
import { join } from 'path';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('EnvToConsul (e2e)', () => {
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
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    await container.stop();
  });

  it('check works of consul', async () => {
    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    await consul.kv.set('file/key1', '"value1"');
    const result = await consul.kv.get<{ Value: string }>('file/key1');
    expect(result.Value).toEqual('"value1"');
  });

  it('check load one file to consul', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    const value = await consul.kv.get<{ Value: string }>('file/key1');
    expect(value.Value).toEqual('"value2"');
  });

  it('check load one file to consul specific root key', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/file.env')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
      `--consul-key=fixtures`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    const value = await consul.kv.get<{ Value: string }>('fixtures/file/key1');
    expect(value.Value).toEqual('"value2"');
  });

  it('check load folder to consul', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    const value = await consul.kv.get<{ Value: string }>('prod/prod-file/prod');
    expect(value.Value).toEqual('"prod-value"');

    const recurseValue = await consul.kv.get<{ Value: string; Key: string }[]>({
      key: 'dev',
      recurse: true,
    });

    expect(
      recurseValue.find((o) => o.Key === 'dev/dev-file/dev')?.Value
    ).toEqual('"dev-value"');
    expect(
      recurseValue.find((o) => o.Key === 'dev/sub-dev/sub-dev-file/sub-dev')
        ?.Value
    ).toEqual('"sub-dev-value"');
  });

  it('check load folder to consul specific root key', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
      `--consul-key=fixtures`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    const value = await consul.kv.get<{ Value: string }>(
      'fixtures/prod/prod-file/prod'
    );
    expect(value.Value).toEqual('"prod-value"');

    const recurseValue = await consul.kv.get<{ Value: string; Key: string }[]>({
      key: 'fixtures/dev',
      recurse: true,
    });

    expect(
      recurseValue.find((o) => o.Key === 'fixtures/dev/dev-file/dev')?.Value
    ).toEqual('"dev-value"');
    expect(
      recurseValue.find(
        (o) => o.Key === 'fixtures/dev/sub-dev/sub-dev-file/sub-dev'
      )?.Value
    ).toEqual('"sub-dev-value"');
  });

  it('check patch part of keys in consul', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });

    // full

    const recurseValue = await consul.kv.get<{ Value: string; Key: string }[]>({
      key: 'dev',
      recurse: true,
    });

    expect(
      recurseValue.find((o) => o.Key === 'dev/dev-file/dev')?.Value
    ).toEqual('"dev-value"');
    expect(
      recurseValue.find((o) => o.Key === 'dev/sub-dev/sub-dev-file/sub-dev')
        ?.Value
    ).toEqual('"sub-dev-value"');

    /// patch

    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder-with-partical-data')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);
    const recursePatchedValue = await consul.kv.get<
      { Value: string; Key: string }[]
    >({
      key: 'dev',
      recurse: true,
    });

    expect(
      recursePatchedValue.find((o) => o.Key === 'dev/dev-file/dev')?.Value
    ).toEqual('"dev-value"');
    expect(
      recursePatchedValue.find(
        (o) => o.Key === 'dev/sub-dev/sub-dev-file/sub-dev'
      )?.Value
    ).toEqual('"sub-dev-partical-value"');
  });

  it('clear part of exists data on load folder to consul', async () => {
    const result = await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });

    // full

    const recurseValue = await consul.kv.get<{ Value: string; Key: string }[]>({
      key: 'dev',
      recurse: true,
    });

    expect(
      recurseValue.find((o) => o.Key === 'dev/dev-file/dev')?.Value
    ).toEqual('"dev-value"');
    expect(
      recurseValue.find((o) => o.Key === 'dev/sub-dev/sub-dev-file/sub-dev')
        ?.Value
    ).toEqual('"sub-dev-value"');

    /// clear exists data

    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures/folder-with-partical-data/dev')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
      `--consul-key=dev`,
      `--consul-clear=true`,
    ]);
    const recursePatchedValue = await consul.kv.get<
      { Value: string; Key: string }[]
    >({
      key: 'dev',
      recurse: true,
    });

    expect(
      recursePatchedValue.find((o) => o.Key === 'dev/dev-file/dev')?.Value
    ).toEqual(undefined);
    expect(
      recursePatchedValue.find(
        (o) => o.Key === 'dev/sub-dev/sub-dev-file/sub-dev'
      )?.Value
    ).toEqual('"sub-dev-partical-value"');
  });
});
