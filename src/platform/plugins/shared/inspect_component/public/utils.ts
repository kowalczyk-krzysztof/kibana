/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { DATA_PATH_ATTRIBUTE_KEY, decodeAttribute } from '@kbn/babel-data-path';
import { inspectComponent } from './inspect_component';
import type {
  CreateHighlightRectangleOptions,
  GetElementFromPointOptions,
  GetInspectedElementOptions,
  HighlightOptions,
  SetHighlightRectangleOptions,
} from './types';

const getElementFromPoint = ({
  event,
  overlay,
}: GetElementFromPointOptions): HTMLElement | null => {
  overlay.style.display = 'none';
  const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
  overlay.style.display = 'block';
  return target;
};

const setHighlightRectangle = ({ target, highlight }: SetHighlightRectangleOptions) => {
  const rectangle = target.getBoundingClientRect();
  highlight.style.top = `${rectangle.top + window.scrollY}px`;
  highlight.style.left = `${rectangle.left + window.scrollX}px`;
  highlight.style.width = `${rectangle.width}px`;
  highlight.style.height = `${rectangle.height}px`;
};

export const isSingleQuote = (event: KeyboardEvent): boolean =>
  event.code === 'Quote' || event.key === "'";

export const isMac = ((navigator as any)?.userAgentData?.platform || navigator.userAgent)
  .toLowerCase()
  .includes('mac');

export const createInspectOverlay = () => {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'crosshair';
  overlay.style.background = 'rgba(0,0,0,0.2)';
  return overlay;
};

export const createInspectHighlight = ({ overlay, euiTheme }: HighlightOptions) => {
  const highlight = document.createElement('div');
  highlight.style.position = 'absolute';
  highlight.style.border = `2px solid ${euiTheme.colors.primary}`;
  highlight.style.background = 'rgba(30, 167, 253, 0.1)';
  highlight.style.pointerEvents = 'none';
  overlay.appendChild(highlight);

  return highlight;
};

export const getInspectedElementInfo = async ({
  event,
  overlay,
  core,
  setFlyoutRef,
  setIsInspecting,
}: GetInspectedElementOptions) => {
  event.preventDefault();
  event.stopPropagation();

  const target = getElementFromPoint({
    event,
    overlay,
  });

  if (!target) return;

  const path = decodeAttribute(target.getAttribute(DATA_PATH_ATTRIBUTE_KEY));

  if (!path) {
    setIsInspecting(false);
    return;
  }

  await inspectComponent({
    core,
    path,
    setFlyoutRef,
    setIsInspecting,
  });
};

export const createHighlightRectangle = ({
  event,
  overlay,
  highlight,
}: CreateHighlightRectangleOptions) => {
  const target = getElementFromPoint({
    event,
    overlay,
  });

  if (!target) return;

  setHighlightRectangle({
    target,
    highlight,
  });
};
