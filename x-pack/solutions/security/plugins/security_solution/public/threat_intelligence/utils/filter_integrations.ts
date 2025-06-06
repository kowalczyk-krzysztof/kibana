/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Integration } from '../hooks/use_integrations';

export const INSTALLATION_STATUS = {
  Installed: 'installed',
  Installing: 'installing',
  InstallFailed: 'install_failed',
  NotInstalled: 'not_installed',
};

export const THREAT_INTELLIGENCE_CATEGORY = 'threat_intel';

export const THREAT_INTELLIGENCE_UTILITIES = 'ti_util';

/**
 * Filter an array of integrations:
 * - of status `installed`
 * - with `threat_intel` category
 * - excluding `ti_util` integration
 *
 * For more details see https://github.com/elastic/security-team/issues/4374
 *
 * @param integrations the response from the packages endpoint in the Fleet plugin
 */
export const filterIntegrations = (integrations: Integration[]): Integration[] =>
  integrations.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pkg: any) =>
      pkg.status === INSTALLATION_STATUS.Installed &&
      pkg.categories.find((category: string) => category === THREAT_INTELLIGENCE_CATEGORY) !=
        null &&
      pkg.id !== THREAT_INTELLIGENCE_UTILITIES
  );
