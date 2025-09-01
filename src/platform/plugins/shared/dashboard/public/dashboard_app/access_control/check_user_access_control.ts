/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { SavedObjectAccessControl } from '@kbn/core/server';
import { coreServices } from '../../services/kibana_services';
import { checkGlobalManageControlPrivilege } from './check_global_manage_control_privilege';

interface CheckUserAccessControlOptions {
  accessControl?: Partial<SavedObjectAccessControl>;
  createdBy?: string;
}

export const checkUserAccessControl = async ({
  accessControl,
  createdBy,
}: CheckUserAccessControlOptions) => {
  try {
    const isGloballyAuthorized = await checkGlobalManageControlPrivilege();

    if (isGloballyAuthorized) {
      return true;
    }

    const user = await coreServices.security.authc.getCurrentUser();
    const userId = user.profile_uid;

    if (!accessControl?.owner) {
      return userId === createdBy;
    }

    return userId === accessControl.owner;
  } catch (error) {
    return false;
  }
};
