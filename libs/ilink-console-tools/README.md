Console ilink tools

[![npm version](https://badge.fury.io/js/ilink-console-tools.svg)](https://badge.fury.io/js/ilink-console-tools)
[![monthly downloads](https://badgen.net/npm/dm/ilink-console-tools)](https://www.npmjs.com/package/ilink-console-tools)

## Installation

```bash
npm i -g ilink-console-tools
```

## Usage

```bash
# upload from file to consul-kv
ilink-console-tools env-to-consul --path=.env --consul-token=myCustomToken --consul-host=localhost
# download from consul-kv to file
ilink-console-tools consul-to-env --consul-token=myCustomToken --path=.env --consul-host=localhost
```

## Consul utils

### env-to-consul - Copy content of .env file(s) to consul

> npx ilink-console-tools "env-to-consul" "--help"

```sh
Usage: ilink-console-tools env-to-consul [options]

Copy content of .env file(s) to consul

Options:
  -f,--path [string]            path to file with .env variables or path to folder with many .env files (default: .env)
  -h,--consul-host [string]     host of consul server (default: localhost)
  -p,--consul-port [string]     port of consul server (default: 8500)
  -k,--consul-key [string]      root key to append .env file(s)
  -t,--consul-token [string]    token for work with consul server
  -c,--consul-clear [boolean]   clear all values and sub values in consul key (default: false)
  -d,--consul-dc [string]       dc of consul server
  -s,--consul-secure [boolean]  work in secure mode (default: false)
  --help                        display help for command
```

### consul-to-env - Save environment variables from consul to .env file

> npx ilink-console-tools "consul-to-env" "--help"

```sh
Usage: ilink-console-tools consul-to-env [options]

Save environment variables from consul to .env file

Options:
  -f,--path [string]            path to file with .env for save or update variables (default: .env)
  -c,--clear [boolean]          clear .env file before save environment variables from consul (default: false)
  -h,--consul-host [string]     host of consul server (default: localhost)
  -p,--consul-port [string]     port of consul server (default: 8500)
  -k,--consul-key [string]      key in consul for retrieve environment variables
  -t,--consul-token [string]    token for work with consul server
  -d,--consul-dc [string]       dc of consul server
  -s,--consul-secure [boolean]  work in secure mode (default: false)
  --help                        display help for command
```

## License

MIT
