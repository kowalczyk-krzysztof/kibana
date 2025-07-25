/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { css } from '@emotion/css';
import type { EuiCommentProps } from '@elastic/eui';
import {
  EuiTextArea,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiAvatar,
  EuiAccordion,
  EuiCommentList,
  EuiText,
  useEuiTheme,
  EuiSpacer,
} from '@elastic/eui';
import type { Comment } from '@kbn/securitysolution-io-ts-list-types';
import { MAX_COMMENT_LENGTH } from '../../../../../common/constants';
import * as i18n from './translations';
import { useCurrentUser } from '../../../../common/lib/kibana';
import { getFormattedComments } from '../../utils/helpers';

interface ExceptionItemCommentsProps {
  exceptionItemComments?: Comment[];
  newCommentValue: string;
  accordionTitle?: JSX.Element;
  initialIsOpen?: boolean;
  newCommentOnChange: (value: string) => void;
  setCommentError: (errorExists: boolean) => void;
}

export const ExceptionItemComments = memo(function ExceptionItemComments({
  exceptionItemComments,
  newCommentValue,
  accordionTitle,
  initialIsOpen = false,
  newCommentOnChange,
  setCommentError,
}: ExceptionItemCommentsProps) {
  const [errorExists, setErrorExists] = useState(false);
  const [shouldShowComments, setShouldShowComments] = useState(false);

  const { euiTheme } = useEuiTheme();
  const avatarStyles = css({
    'margin-right': euiTheme.size.s,
  });
  const accordionStyles = css({
    padding: `${euiTheme.size.m} 0`,
  });

  const currentUser = useCurrentUser();
  const fullName = currentUser?.fullName;
  const userName = currentUser?.username;
  const userEmail = currentUser?.email;
  const avatarName = useMemo(() => {
    if (fullName && fullName.length > 0) {
      return fullName;
    }

    // Did email second because for cloud users, username is a uuid,
    // so favor using name or email prior to using the cloud generated id
    if (userEmail && userEmail.length > 0) {
      return userEmail;
    }

    return userName && userName.length > 0 ? userName : i18n.UNKNOWN_AVATAR_NAME;
  }, [fullName, userEmail, userName]);

  useEffect(() => {
    setCommentError(errorExists);
  }, [errorExists, setCommentError]);

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      newCommentOnChange(event.target.value);
      setErrorExists(event.target.value.length > MAX_COMMENT_LENGTH);
    },
    [newCommentOnChange]
  );

  const handleTriggerOnClick = useCallback((isOpen: boolean) => {
    setShouldShowComments(isOpen);
  }, []);

  const commentsAccordionTitle = useMemo(() => {
    if (exceptionItemComments && exceptionItemComments.length > 0) {
      return (
        <EuiText size="s" data-test-subj="ExceptionItemCommentsAccordionButton">
          {!shouldShowComments
            ? i18n.COMMENTS_SHOW(exceptionItemComments.length)
            : i18n.COMMENTS_HIDE(exceptionItemComments.length)}
        </EuiText>
      );
    } else {
      return null;
    }
  }, [exceptionItemComments, shouldShowComments]);

  const formattedComments = useMemo((): EuiCommentProps[] => {
    if (exceptionItemComments && exceptionItemComments.length > 0) {
      return getFormattedComments(exceptionItemComments);
    } else {
      return [];
    }
  }, [exceptionItemComments]);
  return (
    <div>
      <EuiAccordion
        initialIsOpen={initialIsOpen && !!newCommentValue}
        id={'add-exception-comments-accordion'}
        buttonClassName={accordionStyles}
        buttonContent={accordionTitle ?? commentsAccordionTitle}
        data-test-subj="exceptionItemCommentsAccordion"
        onToggle={(isOpen) => handleTriggerOnClick(isOpen)}
      >
        <EuiCommentList comments={formattedComments} />
        <EuiSpacer />
        <EuiFlexGroup gutterSize={'none'}>
          <EuiFlexItem grow={false}>
            <EuiAvatar
              className={avatarStyles}
              name={avatarName}
              size="l"
              data-test-subj="exceptionItemCommentAvatar"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={1}>
            <EuiFormRow
              fullWidth
              error={i18n.COMMENT_MAX_LENGTH_ERROR(MAX_COMMENT_LENGTH)}
              isInvalid={errorExists}
            >
              <EuiTextArea
                isInvalid={errorExists}
                placeholder={i18n.ADD_COMMENT_PLACEHOLDER}
                aria-label="Comment Input"
                value={newCommentValue}
                onChange={handleOnChange}
                fullWidth={true}
                data-test-subj="newExceptionItemCommentTextArea"
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiAccordion>
    </div>
  );
});
