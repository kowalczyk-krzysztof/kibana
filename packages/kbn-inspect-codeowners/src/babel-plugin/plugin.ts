/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import path from 'path';
import type { JSXAttribute } from '@babel/types';
import type { AddDataPathAttributeOptions } from './types';
import { DATA_PATH_ATTRIBUTE_KEY } from '../constants';
import { encodeAttribute } from '../encode-attribute';

export const addDataPathAttributePlugin = ({
  babel,
  state,
  nodePath,
}: AddDataPathAttributeOptions) => {
  let name: string | undefined;
  const { node } = nodePath;

  if (babel.isJSXIdentifier(node.name)) {
    name = node.name.name;
  } else if (babel.isJSXMemberExpression(node.name)) {
    name = node.name.property.name;
  }

  // Skip React fragments <Fragment> and <>
  if (name === 'Fragment' || babel.isJSXFragment(nodePath.parent)) {
    return;
  }

  // Skip if already has the attribute
  const hasAttr = node.attributes.some(
    (attr: JSXAttribute | any) =>
      babel.isJSXAttribute(attr) &&
      babel.isJSXIdentifier(attr.name, { name: DATA_PATH_ATTRIBUTE_KEY })
  );
  if (hasAttr) return;

  // Compute relative file path
  const filename = state.file?.opts?.filename || '';
  const repoRoot = state.opts.repoRoot || process.cwd();
  const relativePath = path.relative(repoRoot, filename).replace(/\\/g, '/');

  // Get line number
  const line = node.loc?.start?.line || 0;

  node.attributes.push(
    babel.jsxAttribute(
      babel.jsxIdentifier(DATA_PATH_ATTRIBUTE_KEY),
      babel.stringLiteral(encodeAttribute(`${relativePath}:${line}`))
    )
  );
};
