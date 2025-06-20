/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useMemo } from 'react';

import {
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiText,
  EuiToolTip,
  UseEuiTheme,
} from '@elastic/eui';
import {
  useBatchedPublishingSubjects,
  useStateFromPublishingSubject,
} from '@kbn/presentation-publishing';
import { css } from '@emotion/react';
import { useMemoCss } from '@kbn/css-utils/public/use_memo_css';
import { getCompatibleSearchTechniques } from '../../../../../common/options_list/suggestions_searching';
import { useOptionsListContext } from '../options_list_context_provider';
import { OptionsListPopoverSortingButton } from './options_list_popover_sorting_button';
import { OptionsListStrings } from '../options_list_strings';

interface OptionsListPopoverProps {
  showOnlySelected: boolean;
  setShowOnlySelected: (value: boolean) => void;
}

const optionsListPopoverStyles = {
  actions: ({ euiTheme }: UseEuiTheme) => css`
    padding: 0 ${euiTheme.size.s};
    border-bottom: ${euiTheme.border.thin};
    border-color: ${euiTheme.colors.backgroundLightText};
  `,
  searchInputRow: ({ euiTheme }: UseEuiTheme) => css`
    padding-top: ${euiTheme.size.s};
  `,
  cardinalityRow: ({ euiTheme }: UseEuiTheme) => css`
    margin: ${euiTheme.size.xs} 0 !important;
  `,
  borderDiv: ({ euiTheme }: UseEuiTheme) => css`
    height: ${euiTheme.size.base};
    border-right: ${euiTheme.border.thin};
  `,
};

export const OptionsListPopoverActionBar = ({
  showOnlySelected,
  setShowOnlySelected,
}: OptionsListPopoverProps) => {
  const { componentApi, displaySettings } = useOptionsListContext();

  // Using useStateFromPublishingSubject instead of useBatchedPublishingSubjects
  // to avoid debouncing input value
  const searchString = useStateFromPublishingSubject(componentApi.searchString$);

  const [
    searchTechnique,
    searchStringValid,
    invalidSelections,
    totalCardinality,
    field,
    allowExpensiveQueries,
  ] = useBatchedPublishingSubjects(
    componentApi.searchTechnique$,
    componentApi.searchStringValid$,
    componentApi.invalidSelections$,
    componentApi.totalCardinality$,
    componentApi.field$,
    componentApi.parentApi.allowExpensiveQueries$
  );

  const compatibleSearchTechniques = useMemo(() => {
    if (!field) return [];
    return getCompatibleSearchTechniques(field.type);
  }, [field]);

  const defaultSearchTechnique = useMemo(
    () => searchTechnique ?? compatibleSearchTechniques[0],
    [searchTechnique, compatibleSearchTechniques]
  );

  const styles = useMemoCss(optionsListPopoverStyles);

  return (
    <div className="optionsList__actions" css={styles.actions}>
      {compatibleSearchTechniques.length > 0 && (
        <EuiFormRow fullWidth css={styles.searchInputRow}>
          <EuiFieldSearch
            isInvalid={!searchStringValid}
            compressed
            disabled={showOnlySelected}
            fullWidth
            onChange={(event) => {
              componentApi.setSearchString(event.target.value);
            }}
            value={searchString}
            data-test-subj="optionsList-control-search-input"
            placeholder={OptionsListStrings.popover.getSearchPlaceholder(
              allowExpensiveQueries ? defaultSearchTechnique : 'exact'
            )}
          />
        </EuiFormRow>
      )}
      <EuiFormRow fullWidth css={styles.cardinalityRow}>
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          gutterSize="s"
          responsive={false}
        >
          {allowExpensiveQueries && (
            <EuiFlexItem grow={false}>
              <EuiText size="xs" color="subdued" data-test-subj="optionsList-cardinality-label">
                {OptionsListStrings.popover.getCardinalityLabel(totalCardinality)}
              </EuiText>
            </EuiFlexItem>
          )}
          {invalidSelections && invalidSelections.size > 0 && (
            <>
              {allowExpensiveQueries && (
                <EuiFlexItem grow={false}>
                  <div css={styles.borderDiv} />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">
                  {OptionsListStrings.popover.getInvalidSelectionsLabel(invalidSelections.size)}
                </EuiText>
              </EuiFlexItem>
            </>
          )}
          <EuiFlexItem grow={true}>
            <EuiFlexGroup
              gutterSize="xs"
              alignItems="center"
              justifyContent="flexEnd"
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiToolTip
                  position="top"
                  content={
                    showOnlySelected
                      ? OptionsListStrings.popover.getAllOptionsButtonTitle()
                      : OptionsListStrings.popover.getSelectedOptionsButtonTitle()
                  }
                >
                  <EuiButtonIcon
                    size="xs"
                    iconType="list"
                    aria-pressed={showOnlySelected}
                    color={showOnlySelected ? 'primary' : 'text'}
                    display={showOnlySelected ? 'base' : 'empty'}
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    data-test-subj="optionsList-control-show-only-selected"
                    aria-label={
                      showOnlySelected
                        ? OptionsListStrings.popover.getAllOptionsButtonTitle()
                        : OptionsListStrings.popover.getSelectedOptionsButtonTitle()
                    }
                  />
                </EuiToolTip>
              </EuiFlexItem>
              {!displaySettings.hideSort && (
                <EuiFlexItem grow={false}>
                  <OptionsListPopoverSortingButton showOnlySelected={showOnlySelected} />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
    </div>
  );
};
