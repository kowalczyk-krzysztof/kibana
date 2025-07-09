/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  copyToClipboard,
  EuiAccordion,
  EuiButton,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiImage,
  EuiSpacer,
  EuiSwitchEvent,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { css } from '@emotion/react';
import { TimeTypeSection } from './time_type_section';
import type { IShareContext } from '../../context';
import type { LinkShareConfig, LinkShareUIConfig } from '../../../types';
import capybaraImage from './capybara.png';

type LinkProps = Pick<
  IShareContext,
  | 'objectType'
  | 'objectId'
  | 'isDirty'
  | 'shareableUrl'
  | 'shareableUrlLocatorParams'
  | 'allowShortUrl'
> &
  LinkShareConfig['config'] & {
    objectConfig?: LinkShareUIConfig;
  };

const generateSlug = (length = 4) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    slug += chars[randomIndex];
  }
  return slug;
};

interface Capybara {
  id: string;
  x: number;
  y: number;
  dateCreated: string;
  slug: string;
  locatorFrom: string;
  locatorTo: string;
}

interface CapybaraProps extends Capybara {
  onPositionUpdate: (id: string, x: number, y: number) => void;
}

const Capybara = ({
  id,
  x,
  y,
  dateCreated,
  slug,
  onPositionUpdate,
  locatorFrom,
  locatorTo,
}: CapybaraProps) => {
  const { euiTheme } = useEuiTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const capybaraRef = useRef<HTMLDivElement>(null);

  const capybaraContainerCss = css`
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    z-index: calc(${euiTheme.levels.modal} - 1);
    cursor: ${isDragging ? 'grabbing' : 'grab'};
    user-select: none;
    pointer-events: auto;
  `;

  const capybaraImageCss = css`
    width: calc(${euiTheme.size.xxxxl} * 2);
  `;

  const capybaraTextContainerCss = css`
    background-color: ${euiTheme.colors.backgroundBasePlain};
    white-space: pre;
    box-shadow: 0 0 10px ${euiTheme.colors.shadow};
    width: 485px;
  `;

  const timestamp = new Date(dateCreated).getTime();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (capybaraRef.current) {
      const rect = capybaraRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        const boundedX = Math.max(0, newX);
        const boundedY = Math.max(0, newY);

        onPositionUpdate(id, boundedX, boundedY);
      }
    },
    [isDragging, dragOffset, id, onPositionUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <EuiFlexGroup
      ref={capybaraRef}
      gutterSize="s"
      alignItems="center"
      direction="column"
      css={capybaraContainerCss}
      key={id}
      responsive={false}
      wrap
      onMouseDown={handleMouseDown}
    >
      <EuiFlexItem grow={false}>
        <EuiImage src={capybaraImage} alt="capybara" css={capybaraImageCss} draggable={false} />
      </EuiFlexItem>
      <EuiFlexItem grow={false} css={capybaraTextContainerCss}>
        <EuiCode transparentBackground language="json" contentEditable>
          {`{`}
          <br />
          {`  "id": "${id}",`}
          <br />
          {`  "type": "url",`}
          <br />
          {`  "created_at": "${dateCreated}",`}
          <br />
          <EuiAccordion
            id={id}
            arrowDisplay="none"
            buttonContent="[...]"
            initialIsOpen={false}
            css={css`
              margin-left: 18px;
              margin-bottom: -12px;
            `}
            buttonProps={{
              css: css`
                pointer-events: auto;
              `,
            }}
          >
            <div
              style={{
                marginLeft: '-30px',
                marginTop: '-12px',
              }}
            >
              <br />
              {`    "updated_at": "${dateCreated}",`}
              <br />
              {`    "namespaces": [`}
              <br />
              {`      "default"`}
              <br />
              {`    ],`}
              <br />
              {`    "attributes": {`}
              <br />
              {`      "accessCount": 1,`}
              <br />
              {`      "accessDate": ${timestamp},`}
              <br />
              {`      "createDate": ${timestamp},`}
              <br />
              {`      "slug": "${slug}",`}
              <br />
              {`      "url": "",`}
              <br />
              {`      "locatorJSON": "{`}
              <br />
              {`        "id": "DASHBOARD_APP_LOCATOR",`}
              <br />
              {`        "version": "9.2.0",`}
              <br />
              {`        "state": {`}
              <br />
              {`          "dashboardId": "${id}",`}
              <br />
              {`          "preserveSavedFilters": true,`}
              <br />
              {`          "viewMode": "edit",`}
              <br />
              {`          "useHash": false,`}
              <br />
              {`          "timeRange": {`}
              <br />
              {`            "from": "${locatorFrom}",`}
              <br />
              {`            "to": "${locatorTo}"`}
              <br />
              {`          }`}
              <br />
              {`        }`}
              <br />
              {`      }",`}
              <br />
              {`    },`}
              <br />
              {`    "references": [],`}
              <br />
              {`    "managed": false,`}
              <br />
              {`    "coreMigrationVersion": "8.8.0"`}
            </div>
          </EuiAccordion>
          {`}`}
        </EuiCode>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

interface UrlParams {
  [extensionName: string]: {
    [queryParam: string]: boolean;
  };
}

export const LinkContent = ({
  isDirty,
  objectType,
  objectConfig = {},
  shareableUrl,
  shortUrlService,
  shareableUrlLocatorParams,
  allowShortUrl,
}: LinkProps) => {
  const { euiTheme } = useEuiTheme();
  const [snapshotUrl, setSnapshotUrl] = useState<string>('');
  const [isTextCopied, setTextCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAbsoluteTime, setIsAbsoluteTime] = useState(true);
  const [capybaras, setCapybaras] = useState<Capybara[]>([]);
  const urlParamsRef = useRef<UrlParams | undefined>(undefined);
  const urlToCopy = useRef<string | undefined>(undefined);
  const copiedTextToolTipCleanupIdRef = useRef<ReturnType<typeof setTimeout>>();
  const timeRange = shareableUrlLocatorParams?.params?.timeRange;
  const isCapybaraOverload = capybaras.length > 20;

  const portalCss = css`
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    width: 100vw;
    height: 100vh;
    z-index: calc(${euiTheme.levels.modal} + 1);
    background-color: ${isCapybaraOverload ? euiTheme.colors.shadow : 'transparent'};
  `;

  const errorMessageContainerCss = css`
    z-index: ${euiTheme.levels.modal};
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: ${euiTheme.colors.danger};
    padding: ${euiTheme.size.xxxl};
    border: 1px solid ${euiTheme.colors.danger};
    border-radius: 10px;
    box-shadow: 0 0 20px ${euiTheme.colors.danger};
    text-align: center;
    background-color: ${euiTheme.colors.shadow};
    width: 600px;
  `;

  const { delegatedShareUrlHandler, draftModeCallOut: DraftModeCallout } = objectConfig;

  const updateCapybaraPosition = useCallback((id: string, x: number, y: number) => {
    setCapybaras((prev) =>
      prev.map((capybara) => (capybara.id === id ? { ...capybara, x, y } : capybara))
    );
  }, []);

  const getUrlWithUpdatedParams = useCallback((tempUrl: string): string => {
    const urlWithUpdatedParams = urlParamsRef.current
      ? Object.keys(urlParamsRef.current).reduce((urlAccumulator, key) => {
          const urlParam = urlParamsRef.current?.[key];
          return urlParam
            ? Object.keys(urlParam).reduce((queryAccumulator, queryParam) => {
                const isQueryParamEnabled = urlParam[queryParam];
                return isQueryParamEnabled
                  ? queryAccumulator + `&${queryParam}=true`
                  : queryAccumulator;
              }, urlAccumulator)
            : urlAccumulator;
        }, tempUrl)
      : tempUrl;

    return urlWithUpdatedParams;
  }, []);

  useEffect(() => {
    setSnapshotUrl(getUrlWithUpdatedParams(shareableUrl || window.location.href));
  }, [getUrlWithUpdatedParams, shareableUrl]);

  const createShortUrl = useCallback(async () => {
    if (shareableUrlLocatorParams) {
      const shortUrl = await shortUrlService.createWithLocator(
        shareableUrlLocatorParams,
        isAbsoluteTime
      );
      return shortUrl.locator.getUrl(shortUrl.params, { absolute: true });
    } else {
      return (await shortUrlService.createFromLongUrl(snapshotUrl, isAbsoluteTime)).url;
    }
  }, [shareableUrlLocatorParams, shortUrlService, snapshotUrl, isAbsoluteTime]);

  const copyUrlHelper = useCallback(async () => {
    setIsLoading(true);

    if (!urlToCopy.current) {
      urlToCopy.current = delegatedShareUrlHandler
        ? await delegatedShareUrlHandler()
        : allowShortUrl
        ? await createShortUrl()
        : snapshotUrl;
    }

    copyToClipboard(urlToCopy.current);
    setTextCopied(() => {
      if (copiedTextToolTipCleanupIdRef.current) {
        clearTimeout(copiedTextToolTipCleanupIdRef.current);
      }

      // set up timer to revert copied state to false after specified duration
      copiedTextToolTipCleanupIdRef.current = setTimeout(() => setTextCopied(false), 1000);

      // set copied state to true for now
      return true;
    });
    setIsLoading(false);
  }, [snapshotUrl, delegatedShareUrlHandler, allowShortUrl, createShortUrl]);

  const launchCapybaras = async () => {
    await copyUrlHelper();
    const id = uuidv4();
    const randomX = Math.floor(Math.random() * window.innerWidth);
    const randomY = Math.floor(Math.random() * window.innerHeight);
    const dateCreated = new Date(Date.now()).toISOString();
    const slug = generateSlug();
    const locatorFrom = isAbsoluteTime
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      : 'now-7d';
    const locatorTo = isAbsoluteTime ? new Date().toISOString() : 'now';

    setCapybaras((prev) => [
      ...prev,
      { id, x: randomX, y: randomY, dateCreated, slug, isAbsoluteTime, locatorFrom, locatorTo },
    ]);
  };

  const changeTimeType = (e: EuiSwitchEvent) => {
    setIsAbsoluteTime(e.target.checked);
    if (urlToCopy?.current && e.target.checked !== isAbsoluteTime) {
      urlToCopy.current = undefined;
    }
  };

  return (
    <>
      <EuiForm
        style={{
          pointerEvents: isCapybaraOverload ? 'none' : 'auto',
        }}
      >
        <TimeTypeSection
          timeRange={timeRange}
          isAbsoluteTime={isAbsoluteTime}
          changeTimeType={changeTimeType}
        />
        {isDirty && DraftModeCallout && (
          <>
            <EuiSpacer size="m" />
            {DraftModeCallout}
          </>
        )}
        <EuiSpacer size="l" />
      </EuiForm>
      <EuiFlexGroup justifyContent="flexEnd" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={
              isTextCopied && !isCapybaraOverload
                ? i18n.translate('share.link.copied', { defaultMessage: 'Link copied' })
                : null
            }
          >
            <EuiButton
              fill
              data-test-subj="copyShareUrlButton"
              data-share-url={urlToCopy.current}
              onBlur={() => (objectType === 'lens' && isDirty ? null : setTextCopied(false))}
              onClick={launchCapybaras}
              color={objectType === 'lens' && isDirty ? 'warning' : 'primary'}
              isLoading={isLoading}
              disabled={isCapybaraOverload}
            >
              <FormattedMessage id="share.link.copyLinkButton" defaultMessage="Copy link" />
            </EuiButton>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      {ReactDOM.createPortal(
        <EuiFlexGroup css={portalCss} gutterSize="none">
          {capybaras.map(({ id, x, y, dateCreated, slug, locatorFrom, locatorTo }) => (
            <Capybara
              key={id}
              id={id}
              x={x}
              y={y}
              dateCreated={dateCreated}
              slug={slug}
              onPositionUpdate={updateCapybaraPosition}
              locatorFrom={locatorFrom}
              locatorTo={locatorTo}
            />
          ))}
          {isCapybaraOverload && (
            <EuiFlexItem css={errorMessageContainerCss}>
              <EuiTitle
                css={css`
                  color: ${euiTheme.colors.danger};
                `}
              >
                <h2>java.io.IOException:</h2>
              </EuiTitle>
              <EuiText size="relative">No space left on device</EuiText>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>,
        document.getElementById('capybara-overlay') as HTMLElement
      )}
    </>
  );
};
