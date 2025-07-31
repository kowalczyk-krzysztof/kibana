/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import {
  EuiTable,
  EuiTableBody,
  EuiTableRow,
  EuiTableRowCell,
  EuiFlexGroup,
  EuiTablePagination,
  EuiSpacer,
  EuiSearchBar,
  SearchFilterConfig,
  QueryType,
} from '@elastic/eui';

interface Props<T> {
  data: T[];
  columns: Array<ColumnDef<T, any>>;
  pageSize: number;
  pageIndex: number;
  changePage: (pageIndex: number) => void;
  changeItemsPerPage: (pageSize: number) => void;
  searchQuery: QueryType;
  setSearchQuery: (query: QueryType) => void;
  tableSortSelect: SearchFilterConfig[];
  itemsPerPageOptions: number[];
  sortFunction: (a: T, b: T) => number;
  searchFunction: (data: T[], query: QueryType) => T[];
}

export function TanstackDataGrid<T>({
  data,
  columns,
  pageSize,
  pageIndex,
  changePage,
  changeItemsPerPage,
  searchQuery,
  setSearchQuery,
  tableSortSelect,
  itemsPerPageOptions,
  sortFunction,
  searchFunction,
}: Props<T>) {
  const sortedData = useMemo(() => {
    let filtered = data;
    if (searchQuery && searchFunction) {
      filtered = searchFunction(data, searchQuery);
    }

    return [...filtered].sort(sortFunction);
  }, [data, searchQuery, sortFunction, searchFunction]);

  const pageData = useMemo(() => {
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize]);

  const table = useReactTable<T>({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(sortedData.length / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  return (
    <>
      <EuiSearchBar
        onChange={({ query }) => {
          if (query) {
            setSearchQuery(query);
          }
        }}
        box={{ incremental: true }}
        query={searchQuery}
        filters={tableSortSelect}
      />
      <EuiSpacer size="l" />
      <EuiTable>
        <EuiSpacer size="s" />
        <EuiTableBody>
          {table.getRowModel().rows.map((row) => (
            <EuiTableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <EuiTableRowCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </EuiTableRowCell>
              ))}
            </EuiTableRow>
          ))}
        </EuiTableBody>
      </EuiTable>
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="center" alignItems="center">
        <EuiTablePagination
          pageCount={Math.ceil(sortedData.length / pageSize)}
          activePage={pageIndex}
          itemsPerPageOptions={itemsPerPageOptions}
          onChangePage={changePage}
          onChangeItemsPerPage={changeItemsPerPage}
          itemsPerPage={pageSize}
        />
      </EuiFlexGroup>
    </>
  );
}
