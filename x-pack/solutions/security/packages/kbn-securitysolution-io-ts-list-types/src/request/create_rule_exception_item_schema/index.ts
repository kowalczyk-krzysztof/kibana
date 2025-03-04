/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as t from 'io-ts';
import { DefaultUuid } from '@kbn/securitysolution-io-ts-types';

import {
  CreateCommentsArray,
  DefaultCreateCommentsArray,
  description,
  EntriesArray,
  exceptionListItemType,
  ItemId,
  meta,
  NamespaceType,
  namespaceType,
  nonEmptyEntriesArray,
  OsTypeArray,
  osTypeArrayOrUndefined,
  Tags,
  tags,
  name,
  ExpireTimeOrUndefined,
  expireTimeOrUndefined,
} from '../../common';
import { RequiredKeepUndefined } from '../../common/required_keep_undefined';

export const createRuleExceptionListItemSchema = t.intersection([
  t.exact(
    t.type({
      description,
      entries: nonEmptyEntriesArray,
      name,
      type: exceptionListItemType,
    })
  ),
  t.exact(
    t.partial({
      comments: DefaultCreateCommentsArray, // defaults to empty array if not set during decode
      item_id: DefaultUuid, // defaults to GUID (uuid v4) if not set during decode
      list_id: t.undefined,
      meta, // defaults to undefined if not set during decode
      namespace_type: namespaceType, // defaults to 'single' if not set during decode
      os_types: osTypeArrayOrUndefined, // defaults to empty array if not set during decode
      tags, // defaults to empty array if not set during decode
      expire_time: expireTimeOrUndefined,
    })
  ),
]);

export type CreateRuleExceptionListItemSchema = t.OutputOf<
  typeof createRuleExceptionListItemSchema
>;

// This type is used after a decode since some things are defaults after a decode.
export type CreateRuleExceptionListItemSchemaDecoded = Omit<
  RequiredKeepUndefined<t.TypeOf<typeof createRuleExceptionListItemSchema>>,
  'tags' | 'item_id' | 'entries' | 'namespace_type' | 'comments' | 'expire_time'
> & {
  comments: CreateCommentsArray;
  tags: Tags;
  item_id: ItemId;
  entries: EntriesArray;
  namespace_type: NamespaceType;
  os_types: OsTypeArray;
  expire_time: ExpireTimeOrUndefined;
};
