/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { CoreStart } from '@kbn/core/public';
import { createGetterSetter } from '@kbn/kibana-utils-plugin/public';
import { DataPublicPluginStart } from '@kbn/data-plugin/public';
import { FieldFormatsStart } from '@kbn/field-formats-plugin/public';
import { UsageCollectionStart } from '@kbn/usage-collection-plugin/public';

export const [getCoreStart, setCoreStart] = createGetterSetter<CoreStart>('CoreStart');

export const [getDataActions, setDataActions] =
  createGetterSetter<DataPublicPluginStart['actions']>('vislib data.actions');

export const [getFormatService, setFormatService] =
  createGetterSetter<FieldFormatsStart>('FieldFormats');

export const [getUsageCollectionStart, setUsageCollectionStart] =
  createGetterSetter<UsageCollectionStart>('UsageCollection', false);
