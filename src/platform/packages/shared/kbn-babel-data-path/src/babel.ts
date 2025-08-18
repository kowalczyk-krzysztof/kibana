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
import { DATA_PATH_ATTRIBUTE_KEY, PATH_DELIMITER } from './constants';
import type { AddDataPathAttributeOptions } from './types';
import { encodeAttribute } from './encode_attribute';
import { getComponentNameFromFile } from './get_component_name_from_file';

// TODO: Improve this so it can handle more complex cases, like nested components or components defined in different scopes
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

  // Skip React fragments -  <Fragment> and <>
  if (name === 'Fragment' || babel.isJSXFragment(nodePath.parent)) {
    return;
  }

  // Skip if element already has the attribute
  const hasAttr = node.attributes.some(
    (attr: JSXAttribute | any) =>
      babel.isJSXAttribute(attr) &&
      babel.isJSXIdentifier(attr.name, { name: DATA_PATH_ATTRIBUTE_KEY })
  );
  if (hasAttr) return;

  // Get relative file path
  const filename = state.file?.opts?.filename || '';
  const repoRoot = state.opts.repoRoot;
  const relativePath = path.relative(repoRoot, filename).replace(/\\/g, PATH_DELIMITER);

  const componentName = getComponentNameFromFile({ babel, nodePath });

  node.attributes.push(
    babel.jsxAttribute(
      babel.jsxIdentifier(DATA_PATH_ATTRIBUTE_KEY),
      babel.stringLiteral(encodeAttribute(`${relativePath}${PATH_DELIMITER}${componentName || ''}`))
    )
  );
};
