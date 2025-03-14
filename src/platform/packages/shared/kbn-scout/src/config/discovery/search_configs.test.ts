/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ToolingLog } from '@kbn/tooling-log';
import fastGlob from 'fast-glob';
import { getScoutPlaywrightConfigs } from './search_configs';

jest.mock('fast-glob');

describe('getScoutPlaywrightConfigs', () => {
  let mockLog: ToolingLog;

  beforeEach(() => {
    mockLog = new ToolingLog({ level: 'verbose', writeTo: process.stdout });
    jest.spyOn(mockLog, 'info').mockImplementation(() => {});
    jest.spyOn(mockLog, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty map if no matching files are found', () => {
    (fastGlob.sync as jest.Mock).mockReturnValueOnce([]);

    const plugins = getScoutPlaywrightConfigs(['x-pack/plugins'], mockLog);
    expect(plugins.size).toBe(0);
  });

  it('should correctly extract plugin names and group config files', () => {
    (fastGlob.sync as jest.Mock).mockReturnValue([
      'x-pack/platform/plugins/private/plugin_a/ui_tests/playwright.config.ts',
      'x-pack/platform/plugins/private/plugin_a/ui_tests/parallel.playwright.config.ts',
      'x-pack/solutions/security/plugins/plugin_b/ui_tests/playwright.config.ts',
      'src/platform/plugins/shared/plugin_c/ui_tests/playwright.config.ts',
    ]);

    const plugins = getScoutPlaywrightConfigs(['x-pack/', 'src/'], mockLog);

    expect(plugins.size).toBe(3);
    expect(plugins.get('plugin_a')).toEqual({
      configs: [
        'x-pack/platform/plugins/private/plugin_a/ui_tests/playwright.config.ts',
        'x-pack/platform/plugins/private/plugin_a/ui_tests/parallel.playwright.config.ts',
      ],
      usesParallelWorkers: true,
      group: 'platform',
      pluginPath: 'x-pack/platform/plugins/private/plugin_a',
    });
    expect(plugins.get('plugin_b')).toEqual({
      configs: ['x-pack/solutions/security/plugins/plugin_b/ui_tests/playwright.config.ts'],
      usesParallelWorkers: false,
      group: 'security',
      pluginPath: 'x-pack/solutions/security/plugins/plugin_b',
    });
    expect(plugins.get('plugin_c')).toEqual({
      configs: ['src/platform/plugins/shared/plugin_c/ui_tests/playwright.config.ts'],
      usesParallelWorkers: false,
      group: 'platform',
      pluginPath: 'src/platform/plugins/shared/plugin_c',
    });
  });

  it('should log a warning if a file path does not match the expected pattern', () => {
    (fastGlob.sync as jest.Mock).mockReturnValue([
      'x-pack/security/plugins/unknown-path/playwright.config.ts',
    ]);

    const plugins = getScoutPlaywrightConfigs(['x-pack/security'], mockLog);

    expect(plugins.size).toBe(0);
    expect(mockLog.warning).toHaveBeenCalledWith(
      expect.stringContaining('Unable to extract plugin name from path')
    );
  });
});
