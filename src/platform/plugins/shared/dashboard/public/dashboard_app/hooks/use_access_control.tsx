/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { useEffect, useState } from 'react';
import type { AccessControl } from '../access_control';
import { coreServices } from '../../services/kibana_services';

interface UseAccessControl {
  accessControl?: AccessControl;
  createdBy?: string;
}

export const useAccessControl = ({ accessControl, createdBy }: UseAccessControl) => {
  const [canManageAccessControl, setCanManageAccessControl] = useState(false);
  const [isInEditAccessMode, setIsInEditAccessMode] = useState(false);

  useEffect(() => {
    setIsInEditAccessMode(
      !accessControl ||
        accessControl.accessMode === undefined ||
        accessControl.accessMode === 'default'
    );

    const checkUserPrivileges = async () => {
      try {
        const { isGloballyAuthorized } = await coreServices.http.get<{
          isGloballyAuthorized: boolean;
        }>('/api/dashboards/dashboard/access-control/global-authorization', {
          query: { apiVersion: '1' },
        });

        if (isGloballyAuthorized) {
          setCanManageAccessControl(true);
          return;
        }

        const user = await coreServices.security.authc.getCurrentUser();
        const userId = user.profile_uid;

        if (!accessControl?.owner) {
          setCanManageAccessControl(userId === createdBy);
          return;
        }

        setCanManageAccessControl(userId === accessControl.owner);
      } catch (error) {
        setCanManageAccessControl(false);
      }
    };

    checkUserPrivileges();
  }, [accessControl, createdBy]);

  return {
    canManageAccessControl,
    isInEditAccessMode,
  };
};
