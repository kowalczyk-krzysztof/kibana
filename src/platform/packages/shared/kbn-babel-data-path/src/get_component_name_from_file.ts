/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { NodePath } from '@babel/traverse';
import type { GetComponentNameOptions } from './types';

export const getComponentNameFromFile = ({
  nodePath,
  babel,
}: GetComponentNameOptions): string | undefined => {
  let currentPath: NodePath = nodePath;

  while (currentPath) {
    if (currentPath.isFunctionDeclaration() && currentPath.node.id?.name) {
      return currentPath.node.id.name;
    }

    if (currentPath.isClassDeclaration() && currentPath.node.id?.name) {
      return currentPath.node.id.name;
    }

    if (
      (currentPath.isArrowFunctionExpression() || currentPath.isFunctionExpression()) &&
      currentPath.parentPath &&
      currentPath.parentPath.isVariableDeclarator() &&
      babel.isIdentifier(currentPath.parentPath.node.id)
    ) {
      return currentPath.parentPath.node.id.name;
    }

    currentPath = currentPath.parentPath;
  }

  return;
};
