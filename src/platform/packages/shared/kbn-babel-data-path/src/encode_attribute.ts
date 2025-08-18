/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { PATH_DELIMITER, TOKENS } from './constants';

const tokenizePath = (path: string): string =>
  path
    .split(PATH_DELIMITER)
    .map((part) => TOKENS.get(part) ?? part)
    .join(PATH_DELIMITER);

export const encodeAttribute = (path: string): string => {
  const tokenizedPath = tokenizePath(path);

  const utf8Bytes = new TextEncoder().encode(tokenizedPath);
  const binaryString = Array.from(utf8Bytes)
    .map((b) => String.fromCharCode(b))
    .join('');

  return btoa(binaryString);
};
