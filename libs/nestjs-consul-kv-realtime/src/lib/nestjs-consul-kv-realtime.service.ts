import { Injectable } from '@nestjs/common';
import Consul from 'consul';
import { Subject, from, merge, of } from 'rxjs';
import { filter, finalize, map, mergeMap, tap } from 'rxjs/operators';
import { NestjsConsulKvRealtimeConfigService } from './nestjs-consul-kv-realtime.config';
import { NestjsConsulKvRealtimeWatcher } from './nestjs-consul-kv-realtime.types';

@Injectable()
export class NestjsConsulKvRealtimeService {
  public static _instance: NestjsConsulKvRealtimeService;

  public static getInstance() {
    return NestjsConsulKvRealtimeService._instance;
  }

  private watcherRefs: {
    watcher: NestjsConsulKvRealtimeWatcher;
    timeoutRef: NodeJS.Timer | null;
  }[] = [];
  private watcherEvents$ = new Subject<{
    watcher: NestjsConsulKvRealtimeWatcher;
    value: unknown;
  }>();

  private consul!: Consul.Consul;
  private consulKv!: Consul.Kv;

  constructor(
    private readonly nestjsConsulKvRealtimeConfigService: NestjsConsulKvRealtimeConfigService
  ) {
    NestjsConsulKvRealtimeService._instance = this;
  }

  getConsul() {
    if (!this.consul) {
      this.consul = new Consul(this.nestjsConsulKvRealtimeConfigService);
    }
    return this.consul;
  }

  getConsulKv() {
    if (!this.consul) {
      this.consul = new Consul(this.nestjsConsulKvRealtimeConfigService);
    }
    if (!this.consulKv) {
      this.consulKv = this.consul.kv;
    }
    return this.consulKv;
  }

  async addAllWatchers() {
    const watchers = this.nestjsConsulKvRealtimeConfigService.watchers;

    for (let index = 0; index < watchers.length; index++) {
      const watcher = watchers[index];

      await this.addWatcher(watcher);
    }
  }

  removeAllWatchers() {
    for (let index = 0; index < this.watcherRefs.length; index++) {
      this.removeWatcherByIndex(index);
    }
  }

  removeWatchersByKey(key: string) {
    for (let index = 0; index < this.watcherRefs.length; index++) {
      if (this.watcherRefs[index].watcher.key === key) {
        this.removeWatcherByIndex(index);
      }
    }
  }

  removeWatcherByIndex(index: number) {
    const timeoutRef = this.watcherRefs[index].timeoutRef;
    if (timeoutRef) {
      clearTimeout(timeoutRef);
      this.watcherRefs[index].timeoutRef = null;
    }
  }

  async addWatcher(watcher: NestjsConsulKvRealtimeWatcher) {
    watcher.interval =
      watcher.interval ||
      this.nestjsConsulKvRealtimeConfigService.interval ||
      1000;

    const index = this.watcherRefs.push({ timeoutRef: null, watcher }) - 1;

    const timeoutRef = setInterval(
      () =>
        this.watcherHandler(watcher, index).catch((err) =>
          this.nestjsConsulKvRealtimeConfigService.logger.error(err, err.stack)
        ),
      watcher.interval
    );

    this.watcherRefs[index].timeoutRef = timeoutRef;

    await this.watcherHandler(watcher, index);
    return index;
  }

  listen<T>(watcher: NestjsConsulKvRealtimeWatcher) {
    let index: number;
    return from(this.addWatcher(watcher)).pipe(
      tap((watcherIndex) => (index = watcherIndex)),
      mergeMap(() =>
        merge(
          of(this.watcherRefs[index].watcher.value),
          this.watcherEvents$.pipe(
            filter((watcherEvent) => watcherEvent.watcher.key === watcher.key),
            map((watcherEvent) => watcherEvent.value as T)
          )
        )
      ),
      finalize(() => this.removeWatcherByIndex(index))
    );
  }

  async getValue<T>(key: string) {
    let consul: Consul.Kv;
    try {
      consul = this.getConsulKv();
    } catch (err) {
      if (this.nestjsConsulKvRealtimeConfigService.useUndefinedValueForErrors) {
        this.nestjsConsulKvRealtimeConfigService.logger.error(err, err.stack);
        return undefined;
      }
      throw err;
    }

    const keys = await consul.keys<string[]>(key);
    const envData = {};
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      const eachKey = keys[keyIndex].split(key + '/')[1];
      const value = (await consul.get<{ Value: string }>(`${key}/${eachKey}`))
        .Value;
      try {
        envData[eachKey] = JSON.parse(value);
      } catch (err) {
        envData[eachKey] = value;
      }
    }
    return envData as T;
  }

  private async watcherHandler(
    watcher: NestjsConsulKvRealtimeWatcher,
    index: number
  ) {
    return await this.getValue(watcher.key).then((value) => {
      if (JSON.stringify(watcher.value) !== JSON.stringify(value)) {
        this.watcherRefs[index].watcher.value = value;
        this.watcherEvents$.next({ value, watcher });
        return watcher.callback
          ? watcher.callback(value, this.consul)
          : Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
  }
}
