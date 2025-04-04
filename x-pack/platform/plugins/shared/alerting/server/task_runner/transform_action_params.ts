/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginStartContract as ActionsPluginStartContract } from '@kbn/actions-plugin/server';
import type { ActionContextVariables, SummaryActionContextVariables } from '@kbn/alerting-types';
import type { AADAlert } from '@kbn/alerts-as-data-utils';
import { mapKeys, snakeCase } from 'lodash/fp';
import type {
  RuleActionParams,
  AlertInstanceState,
  AlertInstanceContext,
  RuleTypeParams,
} from '../types';
import type { ActionSchedulerRule } from './action_scheduler/types';

export interface TransformActionParamsOptions {
  actionsPlugin: ActionsPluginStartContract;
  alertId: string;
  alertType: string;
  actionId: string;
  actionTypeId: string;
  alertName: string;
  spaceId: string;
  tags?: string[];
  alertInstanceId: string;
  alertUuid: string;
  alertActionGroup: string;
  alertActionGroupName: string;
  actionParams: RuleActionParams;
  alertParams: RuleTypeParams;
  state: AlertInstanceState;
  kibanaBaseUrl?: string;
  context: AlertInstanceContext;
  ruleUrl?: string;
  flapping: boolean;
  aadAlert?: AADAlert;
  consecutiveMatches?: number;
}

interface SummarizedAlertsWithAll {
  new: {
    count: number;
    data: unknown[];
  };
  ongoing: {
    count: number;
    data: unknown[];
  };
  recovered: {
    count: number;
    data: unknown[];
  };
  all: {
    count: number;
    data: unknown[];
  };
}

export function transformActionParams({
  actionsPlugin,
  alertId,
  alertType,
  actionId,
  actionTypeId,
  alertName,
  spaceId,
  tags,
  alertInstanceId,
  alertUuid,
  alertActionGroup,
  alertActionGroupName,
  context,
  actionParams,
  state,
  kibanaBaseUrl,
  alertParams,
  ruleUrl,
  flapping,
  aadAlert,
  consecutiveMatches,
}: TransformActionParamsOptions): RuleActionParams {
  // when the list of variables we pass in here changes,
  // the UI will need to be updated as well; see:
  // x-pack/platform/plugins/shared/triggers_actions_ui/public/application/lib/action_variables.ts

  const variables: ActionContextVariables = {
    alertId,
    alertName,
    spaceId,
    tags,
    alertInstanceId,
    alertActionGroup,
    alertActionGroupName,
    context,
    date: new Date().toISOString(),
    state,
    kibanaBaseUrl,
    params: alertParams,
    rule: {
      params: alertParams,
      id: alertId,
      name: alertName,
      type: alertType,
      spaceId,
      tags,
      url: ruleUrl,
    },
    alert: {
      id: alertInstanceId,
      uuid: alertUuid,
      actionGroup: alertActionGroup,
      actionGroupName: alertActionGroupName,
      flapping,
      consecutiveMatches,
    },
  };

  const variablesWithAADFields: Record<string, unknown> = {
    ...(aadAlert ? { ...aadAlert } : {}),
    // we do not want the AAD fields to overwrite the base fields
    ...variables,
  };

  return actionsPlugin.renderActionParameterTemplates(
    actionTypeId,
    actionId,
    actionParams,
    variablesWithAADFields
  );
}

export function transformSummaryActionParams({
  alerts,
  rule,
  ruleTypeId,
  actionsPlugin,
  actionId,
  actionTypeId,
  spaceId,
  actionParams,
  ruleUrl,
  kibanaBaseUrl,
}: {
  alerts: SummarizedAlertsWithAll;
  rule: ActionSchedulerRule<RuleTypeParams>;
  ruleTypeId: string;
  actionsPlugin: ActionsPluginStartContract;
  actionId: string;
  actionTypeId: string;
  spaceId: string;
  actionParams: RuleActionParams;
  kibanaBaseUrl?: string;
  ruleUrl?: string;
}): RuleActionParams {
  // when the list of variables we pass in here changes,
  // the UI will need to be updated as well; see:
  // x-pack/platform/plugins/shared/triggers_actions_ui/public/application/lib/action_variables.ts

  const variables: SummaryActionContextVariables = {
    alertId: rule.id,
    alertName: rule.name,
    spaceId,
    tags: rule.tags,
    params: rule.params,
    alertInstanceId: rule.id,
    alertActionGroup: 'default',
    alertActionGroupName: 'Default',
    alert: {
      id: rule.id,
      uuid: rule.id,
      actionGroup: 'default',
      actionGroupName: 'Default',
      flapping: false,
      consecutiveMatches: 0,
    },
    kibanaBaseUrl,
    date: new Date().toISOString(),
    // For backwards compatibility with security solutions rules
    context: {
      alerts: alerts.all.data ?? [],
      results_link: ruleUrl,
      rule: mapKeys(snakeCase, {
        ...rule.params,
        name: rule.name,
        id: rule.id,
      }),
    },
    state: {
      signals_count: alerts.all.count ?? 0,
    },
    rule: {
      params: rule.params,
      id: rule.id,
      name: rule.name,
      type: ruleTypeId,
      url: ruleUrl,
      tags: rule.tags,
      spaceId,
    },
    alerts,
  };

  return actionsPlugin.renderActionParameterTemplates(actionTypeId, actionId, actionParams, {
    ...variables,
  });
}
