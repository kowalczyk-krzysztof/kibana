/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { coreServices } from '../../services/kibana_services';

export const getDashboardAuthorName = async (authorId?: string) => {
  if (!authorId) {
    return null;
  }

  try {
    const profiles = await coreServices.userProfile.bulkGet({
      uids: new Set([authorId]),
    });

    return profiles[0].user.username || null;
  } catch (error) {
    return null;
  }
};
