# ilink

Console ilink tools

[![npm version](https://badge.fury.io/js/ilink.svg)](https://badge.fury.io/js/ilink)
[![monthly downloads](https://badgen.net/npm/dm/ilink)](https://www.npmjs.com/package/ilink)

## env-to-consul - Copy content of .env file(s) to consul

> npx ilink "env-to-consul" "--help"

```sh
Usage: ilink env-to-consul [options]

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