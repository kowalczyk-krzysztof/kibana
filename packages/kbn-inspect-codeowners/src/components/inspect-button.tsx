/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { EuiHeaderSectionItemButton } from '@elastic/eui';
import { css } from '@emotion/react';
import { i18n } from '@kbn/i18n';
import { decodeAttribute } from '../decode-attribute';
import { DATA_PATH_ATTRIBUTE_KEY } from '../constants';
// import { getPathsWithOwnersReversed } from '@kbn/dependency-usage';

export const InspectButton = () => {
  const [isInspecting, setIsInspecting] = useState(false);

  const buttonStyle = css`
    background-color: ${isInspecting ? '#0a233c' : 'transparent'};
    & > .euiButtonEmpty__content > svg {
      margin-left: 5px;
    }
  `;

  useEffect(() => {
    if (!isInspecting) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      const dataPath = decodeAttribute(target.getAttribute(DATA_PATH_ATTRIBUTE_KEY) || '');
      // eslint-disable-next-line no-console
      console.log(
        dataPath
          ? `Inspecting element with data-path: ${dataPath} Owners: ${JSON.stringify('')}`
          : 'Inspecting element without data-path'
      );

      setIsInspecting(false);
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [isInspecting]);

  useEffect(() => {
    const keyboardListener = (event: KeyboardEvent) => {
      const isSingleQuote = event.code === 'Quote' || event.key === "'";

      if (event.ctrlKey && isSingleQuote) {
        event.preventDefault();
        setIsInspecting((prev) => !prev);
      }
    };

    window.addEventListener('keydown', keyboardListener);
    return () => {
      window.removeEventListener('keydown', keyboardListener);
    };
  }, []);

  const handleInspectClick = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsInspecting(true);
  };

  return (
    <EuiHeaderSectionItemButton
      onClick={handleInspectClick}
      iconType="inspect"
      isSelected={isInspecting}
      aria-pressed={isInspecting}
      css={buttonStyle}
      aria-label={i18n.translate('kbnInspectCodeowners.inspectButtonAriaLabel', {
        defaultMessage: 'Activate inspect mode',
      })}
    />
  );
};
