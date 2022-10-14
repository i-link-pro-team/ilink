import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import mergeWith from 'lodash.mergewith';

@Injectable()
export class UtilsService {
  public static logLevel = () =>
    (process.env['DEBUG'] === '*' ? 'all' : process.env['DEBUG']) || 'error';

  getWorkspaceProjects(workspaceFile?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workspaceJson: any;
    if (!workspaceFile) {
      workspaceFile = 'workspace.json';
    }
    if (existsSync(workspaceFile)) {
      workspaceJson = JSON.parse(readFileSync(workspaceFile).toString());
    } else {
      workspaceJson = this.getIlinkConfig({ workspace: { projects: [] } });
    }

    return Object.keys(workspaceJson.projects)
      .map((projectName) => {
        const result =
          typeof workspaceJson.projects[projectName] === 'string'
            ? {
                [projectName]: JSON.parse(
                  readFileSync(
                    `${workspaceJson.projects[projectName]}/project.json`
                  ).toString()
                ),
              }
            : { [projectName]: workspaceJson.projects[projectName] };
        result[projectName].root =
          result[projectName].root ||
          (result[projectName].sourceRoot || '')
            .split('/')
            .filter((o, i, a) => i < a.length - 1)
            .join('/');
        return result;
      })
      .reduce((all, cur) => ({ ...all, ...cur }), {});
  }

  getIlinkConfig<T>(defaultValue: T, configFile?: string): T {
    if (!configFile) {
      configFile = 'ilink.json';
    }
    if (!existsSync(configFile)) {
      return defaultValue;
    }
    try {
      const config = JSON.parse(readFileSync(configFile).toString());
      return mergeWith(defaultValue, config);
    } catch (error) {
      return defaultValue;
    }
  }

  getExtractAppName(nxAppName: string) {
    return nxAppName
      .split('-')
      .join('_')
      .replace('-server', '')
      .replace('-ms', '');
  }

  replaceEnv(command: string | undefined, depth = 10): string {
    if (!command) {
      return command || '';
    }
    let newCommand = command;
    Object.keys(process.env).forEach(
      (key) =>
        (newCommand = (newCommand || '')
          .split('%space%')
          .join(' ')
          .split('%br%')
          .join('<br/>')
          .split(`\${${key}}`)
          .join(process.env[key])
          .split(`$${key}`)
          .join(process.env[key]))
    );
    if (command !== newCommand && newCommand.includes('$') && depth > 0) {
      newCommand = this.replaceEnv(newCommand, depth - 1);
    }
    return newCommand || '';
  }
}
