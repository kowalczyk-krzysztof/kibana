/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getAgentIcon } from '@kbn/custom-icons';
import type cytoscape from 'cytoscape';
import { AGENT_NAME, SPAN_SUBTYPE, SPAN_TYPE } from '../../../../common/es_fields/apm';
import { getSpanIcon } from '../../shared/span_icon/get_span_icon';

export function iconForNode(node: cytoscape.NodeSingular) {
  const agentName = node.data(AGENT_NAME);
  const subtype = node.data(SPAN_SUBTYPE);
  const type = node.data(SPAN_TYPE);

  return agentName ? getAgentIcon(agentName, false) : getSpanIcon(type, subtype);
}
