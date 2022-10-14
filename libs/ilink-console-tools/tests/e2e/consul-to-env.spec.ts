import Consul from 'consul';
import execa from 'execa';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('ConsulToEnv (e2e)', () => {
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

  it('save environment variables from consul to file', async () => {
    // fill consul
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    const result = await execa('npm', [
      'start',
      '--',
      'consul-to-env',
      `--path=${join(__dirname, 'fixtures/new.env')}`,
      `--consul-key=file`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const envData = readFileSync(
      join(__dirname, 'fixtures/new.env')
    ).toString();
    expect(envData).toEqual('key1=value2');
  });

  it('update part of environment variables from consul to file', async () => {
    // fill consul
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    // fill env file from consul
    await execa('npm', [
      'start',
      '--',
      'consul-to-env',
      `--path=${join(__dirname, 'fixtures/new.env')}`,
      `--consul-key=file`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    // update file
    writeFileSync(
      join(__dirname, 'fixtures/new.env'),
      `${readFileSync(
        join(__dirname, 'fixtures/new.env')
      ).toString()}\nkey2=new-value2`
    );

    expect(
      readFileSync(join(__dirname, 'fixtures/new.env')).toString()
    ).toEqual('key1=value2\nkey2=new-value2');

    // update exists env in consul
    const consul = new Consul({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      port: container.getMappedPort(8500).toString(),
      host: container.getHost(),
      defaults: {
        token: CONSUL_HTTP_TOKEN,
      },
    });
    await consul.kv.set('file/key1', '"new-value1"');

    const result = await execa('npm', [
      'start',
      '--',
      'consul-to-env',
      `--path=${join(__dirname, 'fixtures/new.env')}`,
      `--consul-key=file`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const envData = readFileSync(
      join(__dirname, 'fixtures/new.env')
    ).toString();
    expect(envData).toEqual('key1=new-value1\nkey2=new-value2');
  });

  it('overwrite environment variables in file from consul', async () => {
    // fill consul
    await execa('npm', [
      'start',
      '--',
      'env-to-consul',
      `--path=${join(__dirname, 'fixtures')}`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    // update file
    writeFileSync(
      join(__dirname, 'fixtures/new.env'),
      `key1=new-value1\nkey2=new-value2`
    );

    expect(
      readFileSync(join(__dirname, 'fixtures/new.env')).toString()
    ).toEqual(`key1=new-value1\nkey2=new-value2`);

    const result = await execa('npm', [
      'start',
      '--',
      'consul-to-env',
      `--path=${join(__dirname, 'fixtures/new.env')}`,
      `--clear=true`,
      `--consul-key=file`,
      `--consul-host=${container.getHost()}`,
      `--consul-token=${CONSUL_HTTP_TOKEN}`,
    ]);

    expect(result.stderr).toEqual('');

    const envData = readFileSync(
      join(__dirname, 'fixtures/new.env')
    ).toString();
    expect(envData).toEqual('key1=value2');
  });
});
