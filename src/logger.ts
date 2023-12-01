import {Logger, ISettingsParam, ILogObj} from 'tslog'

export function makeLogger(options: ISettingsParam<ILogObj> = {}): Logger<ILogObj> {
  return new Logger({
    ...options,
    prettyLogTemplate: '{{dateIsoStr}} {{logLevelName}}\t[{{name}}] ',
    prettyErrorParentNamesSeparator: ' | ',
    prettyLogTimeZone: 'local',
  })
}

export const defaultLogger = makeLogger()
