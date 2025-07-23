/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { TanstackDataGrid } from '@kbn/tanstack-datagrid';

import { QueryType } from '@elastic/eui';
import {
  ManagedAvatarTip,
  NoCreatorTip,
  UserAvatarTip,
} from '@kbn/content-management-user-profiles';
import { TableSortSelect } from './table_sort_select';
import { UpdatedAtField } from './updated_at_field';
import { Tag } from '../types';
import { ItemDetails } from './item_details';
import { DateFormatter } from '../services';

interface DashboardSavedObjectUserContent {
  id: string;
  updatedAt: string;
  createdBy?: string;
  managed?: boolean;
  attributes: {
    title: string;
    description?: string;
  };
}

interface Props {
  items: DashboardSavedObjectUserContent[];
  entityName: string;
  isKibanaVersioningEnabled: boolean;
  isFavoritesEnabled: boolean;
  getDetailViewLink: (entity: any) => string | undefined;
  getOnClickTitle: (item: any) => (() => void) | undefined;
  addOrRemoveExcludeTagFilter: (tag: Tag) => void;
  addOrRemoveIncludeTagFilter: (tag: Tag) => void;
  dateFormatterComp?: DateFormatter;
  hasUpdatedAtMetadata: boolean;
  hasRecentlyAccessedMetadata: boolean;
}

const TanstackTableComponent = ({
  items,
  entityName,
  isKibanaVersioningEnabled,
  isFavoritesEnabled,
  getDetailViewLink,
  getOnClickTitle,
  addOrRemoveExcludeTagFilter,
  addOrRemoveIncludeTagFilter,
  dateFormatterComp,
  hasUpdatedAtMetadata,
  hasRecentlyAccessedMetadata,
}: Props) => {
  const [pageSize, setPageSize] = useState(50);
  const [pageIndex, setPageIndex] = useState(0);
  const [sortField, setSortField] = useState<'title' | 'updatedAt'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState<QueryType>('');

  const onSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    const newSortField = field === 'attributes.title' ? 'title' : 'updatedAt';
    setSortField(newSortField);
    setSortDirection(direction);
    setPageIndex(0);
  }, []);

  const CustomTableSortSelect = useCallback(
    () => (
      <TableSortSelect
        tableSort={{
          field: sortField === 'title' ? 'attributes.title' : sortField,
          direction: sortDirection,
        }}
        onChange={onSortChange}
        hasUpdatedAtMetadata={hasUpdatedAtMetadata}
        hasRecentlyAccessedMetadata={hasRecentlyAccessedMetadata}
      />
    ),
    [sortField, sortDirection, onSortChange, hasUpdatedAtMetadata, hasRecentlyAccessedMetadata]
  );

  const tableSortSelect = useMemo(
    () => ({
      type: 'custom_component' as const,
      component: CustomTableSortSelect,
    }),
    [CustomTableSortSelect]
  );

  const columns = useMemo<Array<ColumnDef<DashboardSavedObjectUserContent>>>(
    () => [
      {
        header: 'Name',
        accessorKey: 'title',
        cell: ({ row }) => {
          const record = row.original;
          return (
            <ItemDetails<any>
              id={'userContent'}
              item={record}
              getDetailViewLink={getDetailViewLink}
              getOnClickTitle={getOnClickTitle}
              onClickTag={(tag, withModifierKey) => {
                if (withModifierKey) {
                  addOrRemoveExcludeTagFilter(tag);
                } else {
                  addOrRemoveIncludeTagFilter(tag);
                }
              }}
              isFavoritesEnabled={isFavoritesEnabled}
            />
          );
        },
      },

      {
        header: 'Creator',
        accessorKey: 'createdBy',
        cell: ({ row }) => {
          const record = row.original;

          return record.createdBy ? (
            <UserAvatarTip uid={record.createdBy} />
          ) : record.managed ? (
            <ManagedAvatarTip entityName={entityName} />
          ) : (
            <NoCreatorTip iconType={'minus'} includeVersionTip={isKibanaVersioningEnabled} />
          );
        },
      },
      {
        header: 'Last updated',
        accessorKey: 'updatedAt',
        cell: ({ row }) => {
          const record = row.original;
          return (
            <UpdatedAtField dateTime={record.updatedAt} DateFormatterComp={dateFormatterComp} />
          );
        },
      },
    ],
    [
      entityName,
      isKibanaVersioningEnabled,
      isFavoritesEnabled,
      getDetailViewLink,
      getOnClickTitle,
      addOrRemoveExcludeTagFilter,
      addOrRemoveIncludeTagFilter,
      dateFormatterComp,
    ]
  );

  const sortFunction = useCallback(
    // @ts-expect-error .
    (a, b) => {
      const aVal = sortField === 'title' ? a.attributes.title ?? '' : a.updatedAt ?? '';
      const bVal = sortField === 'title' ? b.attributes.title ?? '' : b.updatedAt ?? '';
      const compareResult = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? compareResult : -compareResult;
    },
    [sortField, sortDirection]
  );

  const searchFunction = useCallback(
    (
      data: DashboardSavedObjectUserContent[],
      query: QueryType
    ): DashboardSavedObjectUserContent[] => {
      const queryText =
        typeof query === 'string' ? query.toLowerCase() : query?.text?.toLowerCase();
      if (!queryText) {
        return data;
      }
      return data.filter((item) => item.attributes.title.toLowerCase().includes(queryText));
    },
    []
  );

  const changePage = useCallback((_pageIndex: number) => {
    setPageIndex(_pageIndex);
  }, []);

  const changeItemsPerPage = useCallback((_pageSize: number) => {
    setPageSize(_pageSize);
    setPageIndex(0);
  }, []);

  return (
    <TanstackDataGrid
      data={items}
      changePage={changePage}
      changeItemsPerPage={changeItemsPerPage}
      columns={columns}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      pageSize={pageSize}
      pageIndex={pageIndex}
      tableSortSelect={[tableSortSelect]}
      itemsPerPageOptions={[10, 20, 50]}
      sortFunction={sortFunction}
      searchFunction={searchFunction}
    />
  );
};

export const TanstackTable = memo(TanstackTableComponent);
