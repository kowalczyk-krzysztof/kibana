/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  EuiAccordion,
  EuiButtonIcon,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { Fragment } from 'react';
import styled from '@emotion/styled';
import { isEmpty } from 'lodash';
import { css } from '@emotion/react';

interface KeyValue {
  key: string;
  value: any | undefined;
  isFilterable: boolean;
}

const StyledEuiAccordion = styled(EuiAccordion)`
  width: 100%;
  .buttonContentContainer .euiIEFlexWrapFix {
    width: 100%;
  }
`;

const StyledEuiDescriptionList = styled(EuiDescriptionList)`
  margin: ${({ theme }) =>
    `${theme.euiTheme.size.s} ${theme.euiTheme.size.s} 0 ${theme.euiTheme.size.s}`};
  .descriptionList__title,
  .descriptionList__description {
    margin-top: 0;
    align-items: center;
    display: flex;
`;

function removeEmptyValues(items: KeyValue[]) {
  return items.filter(({ value }) => !isEmpty(value));
}

export function KeyValueFilterList({
  icon,
  title,
  keyValueList,
  initialIsOpen = false,
  onClickFilter,
}: {
  title: string;
  keyValueList: KeyValue[];
  initialIsOpen?: boolean;
  icon?: string;
  onClickFilter: (filter: { key: string; value: any }) => void;
}) {
  const nonEmptyKeyValueList = removeEmptyValues(keyValueList);
  if (!nonEmptyKeyValueList.length) {
    return null;
  }

  return (
    <StyledEuiAccordion
      initialIsOpen={initialIsOpen}
      id={title}
      buttonContent={<AccordionButtonContent icon={icon} title={title} />}
      buttonClassName="buttonContentContainer"
    >
      <StyledEuiDescriptionList type="column" columnWidths={['20%', '80%']}>
        {nonEmptyKeyValueList.map(({ key, value, isFilterable }) => {
          return (
            <Fragment key={key}>
              <EuiDescriptionListTitle
                className="descriptionList__title"
                css={css`
                  height: 40px;
                `}
              >
                <EuiText
                  size="s"
                  css={css`
                    font-weight: bold;
                  `}
                >
                  {key}
                </EuiText>
              </EuiDescriptionListTitle>
              <EuiDescriptionListDescription
                className="descriptionList__description"
                css={css`
                  height: 40px;
                `}
              >
                <EuiFlexGroup alignItems="baseline" responsive={false} gutterSize="none">
                  <EuiFlexItem
                    css={css`
                      min-width: 32px;
                    `}
                    grow={false}
                  >
                    {isFilterable && (
                      <EuiToolTip
                        position="top"
                        content={i18n.translate('xpack.apm.keyValueFilterList.actionFilterLabel', {
                          defaultMessage: 'Filter by value',
                        })}
                      >
                        <EuiButtonIcon
                          iconType="filter"
                          color="text"
                          size="m"
                          onClick={() => {
                            onClickFilter({ key, value });
                          }}
                          aria-label={i18n.translate(
                            'xpack.apm.keyValueFilterList.actionFilterLabel',
                            { defaultMessage: 'Filter by value' }
                          )}
                          data-test-subj={`filter_by_${key}`}
                        />
                      </EuiToolTip>
                    )}
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">{value}</EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiDescriptionListDescription>
            </Fragment>
          );
        })}
      </StyledEuiDescriptionList>
    </StyledEuiAccordion>
  );
}

function AccordionButtonContent({ icon, title }: { icon?: string; title: string }) {
  return (
    <EuiFlexGroup responsive={false} gutterSize="s">
      {icon && (
        <EuiFlexItem grow={false}>
          <EuiIcon type={icon} size="l" title={title} data-test-subj="accordion_title_icon" />
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <EuiText>{title}</EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
