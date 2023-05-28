import {Logger, ISettingsParam} from 'tslog';

export function make(options: ISettingsParam = {}): Logger {
  return new Logger({
    ...options,
    displayFunctionName: false,
    displayFilePath: 'hidden',
    dateTimeTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export const defaultLogger = make();
