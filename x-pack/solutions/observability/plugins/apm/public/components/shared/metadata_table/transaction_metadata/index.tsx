/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { ProcessorEvent } from '@kbn/observability-plugin/common';
import type { Transaction } from '../../../../../typings/es_schemas/ui/transaction';
import { getSectionsFromFields } from '../helper';
import { MetadataTable } from '..';
import { FETCH_STATUS, useFetcher } from '../../../../hooks/use_fetcher';

interface Props {
  transaction: Transaction;
}

export function TransactionMetadata({ transaction }: Props) {
  const { data: transactionEvent, status } = useFetcher(
    (callApmApi) => {
      return callApmApi('GET /internal/apm/event_metadata/{processorEvent}/{id}', {
        params: {
          path: {
            processorEvent: ProcessorEvent.transaction,
            id: transaction.transaction.id,
          },
          query: {
            start: transaction['@timestamp'],
            end: transaction['@timestamp'],
          },
        },
      });
    },
    [transaction]
  );

  const sections = useMemo(
    () => getSectionsFromFields(transactionEvent?.metadata || {}),
    [transactionEvent?.metadata]
  );
  return <MetadataTable sections={sections} isLoading={status === FETCH_STATUS.LOADING} />;
}
