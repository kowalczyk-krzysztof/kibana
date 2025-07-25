/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { estypes } from '@elastic/elasticsearch';
import { POD_FIELD, HOST_FIELD, CONTAINER_FIELD } from '../constants';
import { host } from './host';
import { pod } from './kubernetes/pod';
import { awsEC2 } from './aws_ec2';
import { awsS3 } from './aws_s3';
import { awsRDS } from './aws_rds';
import { awsSQS } from './aws_sqs';
import { container } from './container';
import type { InventoryItemType } from './types';
export { metrics } from './metrics';

const catalog = {
  host,
  pod,
  container,
  awsEC2,
  awsS3,
  awsRDS,
  awsSQS,
} as const;
export const inventoryModels = Object.values(catalog);
export type InventoryModels = typeof catalog;

export const findInventoryModel = <TType extends keyof InventoryModels>(
  type: TType
): InventoryModels[TType] => {
  const model = catalog[type];
  if (!model) {
    throw new Error(
      i18n.translate('xpack.metricsData.inventoryModels.findInventoryModel.error', {
        defaultMessage: "The inventory model you've attempted to find does not exist",
      })
    );
  }

  return model;
};

const LEGACY_TYPES = ['host', 'pod', 'container'];

export const getFieldByType = (type: InventoryItemType) => {
  switch (type) {
    case 'pod':
      return POD_FIELD;
    case 'host':
      return HOST_FIELD;
    case 'container':
      return CONTAINER_FIELD;
  }
};

export const findInventoryFields = (type: InventoryItemType) => {
  const inventoryModel = findInventoryModel(type);
  if (LEGACY_TYPES.includes(type)) {
    const id = getFieldByType(type) || inventoryModel.fields.id;
    return {
      ...inventoryModel.fields,
      id,
    };
  } else {
    return inventoryModel.fields;
  }
};

export const isBasicMetricAgg = (
  agg: unknown
): agg is Record<string, undefined | Pick<estypes.AggregationsMetricAggregationBase, 'field'>> => {
  if (agg === null || typeof agg !== 'object') return false;

  return Object.values(agg).some(
    (value) =>
      value === undefined ||
      (value && 'field' in (value as estypes.AggregationsMetricAggregationBase))
  );
};

export const isDerivativeAgg = (
  agg: unknown
): agg is Pick<estypes.AggregationsAggregationContainer, 'derivative'> => {
  return !!(agg as estypes.AggregationsAggregationContainer).derivative;
};

export const isSumBucketAgg = (
  agg: unknown
): agg is Pick<estypes.AggregationsAggregationContainer, 'sum_bucket'> => {
  return !!(agg as estypes.AggregationsAggregationContainer).sum_bucket;
};

export const isTermsWithAggregation = (
  agg: unknown
): agg is Pick<estypes.AggregationsAggregationContainer, 'terms' | 'aggregations'> => {
  const aggContainer = agg as estypes.AggregationsAggregationContainer;
  return !!(aggContainer.aggregations && aggContainer.terms);
};
