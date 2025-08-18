/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { PATH_DELIMITER } from '@kbn/babel-data-path';
import { INSPECT_COMPONENT_ROUTE } from '../common/constants';
import { InspectFlyout, flyoutOptions } from './inspect_flyout';
import type { InspectComponentResponse } from '../common';
import type { InspectComponentOptions } from './types';

const getComponentName = (path: string): string => {
  const componentIndex = path.lastIndexOf(PATH_DELIMITER);
  return path.substring(componentIndex + PATH_DELIMITER.length);
};

export const inspectComponent = async ({
  core,
  path,
  setFlyoutRef,
  setIsInspecting,
}: InspectComponentOptions) => {
  try {
    const response: InspectComponentResponse = await core.http.post(INSPECT_COMPONENT_ROUTE, {
      body: JSON.stringify({ path }),
    });

    const codeowners = response.codeowners.join(', ');
    const componentName = getComponentName(path);

    const flyout = core.overlays.openFlyout(
      toMountPoint(
        <InspectFlyout codeowners={codeowners} componentName={componentName} />,
        core.rendering
      ),
      flyoutOptions
    );

    setFlyoutRef(flyout);
  } catch (e) {
    return;
  } finally {
    setIsInspecting(false);
  }
};
