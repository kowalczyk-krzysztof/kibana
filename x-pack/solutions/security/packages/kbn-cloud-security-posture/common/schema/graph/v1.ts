/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ApiMessageCode } from '../../types/graph/v1';

export const INDEX_PATTERN_REGEX = /^[^A-Z^\\/?"<>|\s#,]+$/;

export const graphRequestSchema = schema.object({
  nodesLimit: schema.maybe(schema.number()),
  showUnknownTarget: schema.maybe(schema.boolean()),
  query: schema.object({
    originEventIds: schema.arrayOf(
      schema.object({ id: schema.string(), isAlert: schema.boolean() })
    ),
    // TODO: use zod for range validation instead of config schema
    start: schema.oneOf([schema.number(), schema.string()]),
    end: schema.oneOf([schema.number(), schema.string()]),
    indexPatterns: schema.maybe(
      schema.arrayOf(
        schema.string({
          minLength: 1,
          validate: (value) => {
            if (!INDEX_PATTERN_REGEX.test(value)) {
              return `Invalid index pattern: ${value}. Contains illegal characters.`;
            }
          },
        }),
        { minSize: 1 }
      )
    ),
    esQuery: schema.maybe(
      schema.object({
        bool: schema.object({
          filter: schema.maybe(schema.arrayOf(schema.object({}, { unknowns: 'allow' }))),
          must: schema.maybe(schema.arrayOf(schema.object({}, { unknowns: 'allow' }))),
          should: schema.maybe(schema.arrayOf(schema.object({}, { unknowns: 'allow' }))),
          must_not: schema.maybe(schema.arrayOf(schema.object({}, { unknowns: 'allow' }))),
        }),
      })
    ),
  }),
});

export const DOCUMENT_TYPE_EVENT = 'event' as const;
export const DOCUMENT_TYPE_ALERT = 'alert' as const;

export const nodeDocumentDataSchema = schema.object({
  id: schema.string(),
  type: schema.oneOf([schema.literal(DOCUMENT_TYPE_EVENT), schema.literal(DOCUMENT_TYPE_ALERT)]),
  index: schema.maybe(schema.string()),
  alert: schema.maybe(
    schema.object({
      ruleName: schema.maybe(schema.string()),
    })
  ),
});

export const graphResponseSchema = () =>
  schema.object({
    nodes: schema.arrayOf(
      schema.oneOf([entityNodeDataSchema, groupNodeDataSchema, labelNodeDataSchema])
    ),
    edges: schema.arrayOf(edgeDataSchema),
    messages: schema.maybe(
      schema.arrayOf(schema.oneOf([schema.literal(ApiMessageCode.ReachedNodesLimit)]))
    ),
  });

export const nodeColorSchema = schema.oneOf([
  schema.literal('primary'),
  schema.literal('danger'),
  schema.literal('warning'),
]);

export const edgeColorSchema = schema.oneOf([
  schema.literal('primary'),
  schema.literal('danger'),
  schema.literal('warning'),
  schema.literal('subdued'),
]);

export const nodeShapeSchema = schema.oneOf([
  schema.literal('hexagon'),
  schema.literal('pentagon'),
  schema.literal('ellipse'),
  schema.literal('rectangle'),
  schema.literal('diamond'),
  schema.literal('label'),
  schema.literal('group'),
]);

export const nodeBaseDataSchema = schema.object({
  id: schema.string(),
  label: schema.maybe(schema.string()),
  icon: schema.maybe(schema.string()),
});

export const entityNodeDataSchema = schema.allOf([
  nodeBaseDataSchema,
  schema.object({
    color: nodeColorSchema,
    shape: schema.oneOf([
      schema.literal('hexagon'),
      schema.literal('pentagon'),
      schema.literal('ellipse'),
      schema.literal('rectangle'),
      schema.literal('diamond'),
    ]),
    tag: schema.maybe(schema.string()),
    documentsData: schema.maybe(schema.arrayOf(nodeDocumentDataSchema)),
  }),
]);

export const groupNodeDataSchema = schema.allOf([
  nodeBaseDataSchema,
  schema.object({
    shape: schema.literal('group'),
  }),
]);

export const labelNodeDataSchema = schema.allOf([
  nodeBaseDataSchema,
  schema.object({
    shape: schema.literal('label'),
    parentId: schema.maybe(schema.string()),
    color: nodeColorSchema,
    documentsData: schema.maybe(schema.arrayOf(nodeDocumentDataSchema)),
  }),
]);

export const edgeDataSchema = schema.object({
  id: schema.string(),
  source: schema.string(),
  target: schema.string(),
  color: edgeColorSchema,
  type: schema.maybe(schema.oneOf([schema.literal('solid'), schema.literal('dashed')])),
});
