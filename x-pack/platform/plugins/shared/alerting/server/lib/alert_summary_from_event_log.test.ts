/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { random, mean } from 'lodash';
import type { SanitizedRule, AlertSummary } from '../types';
import type { IValidatedEvent } from '@kbn/event-log-plugin/server';
import { millisToNanos, nanosToMillis } from '@kbn/event-log-plugin/server';
import { EVENT_LOG_ACTIONS, EVENT_LOG_PROVIDER, LEGACY_EVENT_LOG_ACTIONS } from '../plugin';
import { alertSummaryFromEventLog } from './alert_summary_from_event_log';

const ONE_HOUR_IN_MILLIS = 60 * 60 * 1000;
const dateStart = '2020-06-18T00:00:00.000Z';
const dateEnd = dateString(dateStart, ONE_HOUR_IN_MILLIS);

describe('alertSummaryFromEventLog', () => {
  test('no events and muted ids', async () => {
    const rule = createRule({});
    const events: IValidatedEvent[] = [];
    const executionEvents: IValidatedEvent[] = [];
    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    expect(summary).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {},
        "consumer": "rule-consumer",
        "enabled": false,
        "errorMessages": Array [],
        "executionDuration": Object {
          "average": 0,
          "valuesWithTimestamp": Object {},
        },
        "id": "rule-123",
        "lastRun": undefined,
        "muteAll": false,
        "name": "rule-name",
        "revision": 0,
        "ruleTypeId": "123",
        "status": "OK",
        "statusEndDate": "2020-06-18T01:00:00.000Z",
        "statusStartDate": "2020-06-18T00:00:00.000Z",
        "tags": Array [],
        "throttle": null,
      }
    `);
  });

  test('different rule properties', async () => {
    const rule = createRule({
      id: 'rule-456',
      alertTypeId: '456',
      schedule: { interval: '100s' },
      enabled: true,
      name: 'rule-name-2',
      tags: ['tag-1', 'tag-2'],
      consumer: 'rule-consumer-2',
      throttle: '1h',
      muteAll: true,
    });
    const events: IValidatedEvent[] = [];
    const executionEvents: IValidatedEvent[] = [];
    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart: dateString(dateEnd, ONE_HOUR_IN_MILLIS),
      dateEnd: dateString(dateEnd, ONE_HOUR_IN_MILLIS * 2),
    });

    expect(summary).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {},
        "consumer": "rule-consumer-2",
        "enabled": true,
        "errorMessages": Array [],
        "executionDuration": Object {
          "average": 0,
          "valuesWithTimestamp": Object {},
        },
        "id": "rule-456",
        "lastRun": undefined,
        "muteAll": true,
        "name": "rule-name-2",
        "revision": 0,
        "ruleTypeId": "456",
        "status": "OK",
        "statusEndDate": "2020-06-18T03:00:00.000Z",
        "statusStartDate": "2020-06-18T02:00:00.000Z",
        "tags": Array [
          "tag-1",
          "tag-2",
        ],
        "throttle": "1h",
      }
    `);
  });

  test('two muted alerts', async () => {
    const rule = createRule({
      mutedInstanceIds: ['alert-1', 'alert-2'],
    });
    const events: IValidatedEvent[] = [];
    const executionEvents: IValidatedEvent[] = [];
    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": true,
            "status": "OK",
            "tracked": true,
            "uuid": undefined,
          },
          "alert-2": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": true,
            "status": "OK",
            "tracked": true,
            "uuid": undefined,
          },
        },
        "lastRun": undefined,
        "status": "OK",
      }
    `);
  });

  test('active rule but no alerts', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory.addExecute().advanceTime(10000).addExecute().getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {},
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "OK",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('active rule with no alerts but has errors', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute('oof!')
      .advanceTime(10000)
      .addExecute('rut roh!')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, errorMessages, alerts, executionDuration } = summary;
    expect({ lastRun, status, errorMessages, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {},
        "errorMessages": Array [
          Object {
            "date": "2020-06-18T00:00:00.000Z",
            "message": "oof!",
          },
          Object {
            "date": "2020-06-18T00:00:10.000Z",
            "message": "rut roh!",
          },
        ],
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Error",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently inactive alert', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addRecoveredAlert('alert-1', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": false,
            "status": "OK",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "OK",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('legacy rule with currently inactive alert', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addLegacyResolvedAlert('alert-1', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": false,
            "status": "OK",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "OK",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently inactive alert, no new-instance', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addRecoveredAlert('alert-1', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": false,
            "status": "OK",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "OK",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently active alert', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group A",
            "activeStartDate": "2020-06-18T00:00:00.000Z",
            "flapping": false,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently active alert with no action group in event log', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', undefined, 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', undefined, 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": undefined,
            "activeStartDate": "2020-06-18T00:00:00.000Z",
            "flapping": false,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently active alert that switched action groups', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group B', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group B",
            "activeStartDate": "2020-06-18T00:00:00.000Z",
            "flapping": false,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently active alert, no new-instance', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });
    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group A",
            "activeStartDate": undefined,
            "flapping": false,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with active and inactive muted alerts', async () => {
    const rule = createRule({ mutedInstanceIds: ['alert-1', 'alert-2'] });
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .addNewAlert('alert-2', 'uuid-2')
      .addActiveAlert('alert-2', 'action group B', 'uuid-2')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .addRecoveredAlert('alert-2', 'uuid-2')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });
    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group A",
            "activeStartDate": "2020-06-18T00:00:00.000Z",
            "flapping": false,
            "muted": true,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
          "alert-2": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": true,
            "status": "OK",
            "tracked": true,
            "uuid": "uuid-2",
          },
        },
        "lastRun": "2020-06-18T00:00:10.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with active and inactive alerts over many executes', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addNewAlert('alert-1', 'uuid-1')
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .addNewAlert('alert-2', 'uuid-2')
      .addActiveAlert('alert-2', 'action group B', 'uuid-2')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1')
      .addRecoveredAlert('alert-2', 'uuid-2')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group B', 'uuid-1')
      .advanceTime(10000)
      .addExecute()
      .addActiveAlert('alert-1', 'action group B', 'uuid-1')
      .getEvents();
    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });

    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group B",
            "activeStartDate": "2020-06-18T00:00:00.000Z",
            "flapping": false,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
          "alert-2": Object {
            "actionGroupId": undefined,
            "activeStartDate": undefined,
            "flapping": false,
            "muted": false,
            "status": "OK",
            "tracked": true,
            "uuid": "uuid-2",
          },
        },
        "lastRun": "2020-06-18T00:00:30.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  test('rule with currently active alert, flapping', async () => {
    const rule = createRule({});
    const eventsFactory = new EventsFactory();
    const events = eventsFactory
      .addExecute()
      .addActiveAlert('alert-1', 'action group A', 'uuid-1', true)
      .getEvents();

    const executionEvents = eventsFactory.getEvents();

    const summary: AlertSummary = alertSummaryFromEventLog({
      rule,
      events,
      executionEvents,
      dateStart,
      dateEnd,
    });
    const { lastRun, status, alerts, executionDuration } = summary;
    expect({ lastRun, status, alerts }).toMatchInlineSnapshot(`
      Object {
        "alerts": Object {
          "alert-1": Object {
            "actionGroupId": "action group A",
            "activeStartDate": undefined,
            "flapping": true,
            "muted": false,
            "status": "Active",
            "tracked": true,
            "uuid": "uuid-1",
          },
        },
        "lastRun": "2020-06-18T00:00:00.000Z",
        "status": "Active",
      }
    `);

    testExecutionDurations(eventsFactory.getExecutionDurations(), executionDuration);
  });

  const testExecutionDurations = (
    actualDurations: Record<string, number>,
    executionDuration?: {
      average?: number;
      valuesWithTimestamp?: Record<string, number>;
    }
  ) => {
    expect(executionDuration).toEqual({
      average: Math.round(mean(Object.values(actualDurations))),
      valuesWithTimestamp: actualDurations,
    });
  };
});

function dateString(isoBaseDate: string, offsetMillis = 0): string {
  return new Date(Date.parse(isoBaseDate) + offsetMillis).toISOString();
}

export class EventsFactory {
  private events: IValidatedEvent[] = [];

  constructor(private date: string = dateStart) {}

  getEvents(): IValidatedEvent[] {
    // ES normally returns events sorted newest to oldest, so we need to sort
    // that way also
    const events = this.events.slice();
    events.sort((a, b) => -a!['@timestamp']!.localeCompare(b!['@timestamp']!));
    return events;
  }

  getTime(): string {
    return this.date;
  }

  advanceTime(millis: number): EventsFactory {
    this.date = dateString(this.date, millis);
    return this;
  }

  addExecute(errorMessage?: string): EventsFactory {
    let event: IValidatedEvent = {
      '@timestamp': this.date,
      event: {
        provider: EVENT_LOG_PROVIDER,
        action: EVENT_LOG_ACTIONS.execute,
        duration: millisToNanos(random(2000, 180000)),
      },
    };

    if (errorMessage) {
      event = { ...event, error: { message: errorMessage } };
    }

    this.events.push(event);
    return this;
  }

  addActiveAlert(
    alertId: string,
    actionGroupId: string | undefined,
    uuid: string,
    flapping = false
  ): EventsFactory {
    const kibanaAlerting = actionGroupId
      ? { instance_id: alertId, action_group_id: actionGroupId }
      : { instance_id: alertId };
    this.events.push({
      '@timestamp': this.date,
      event: {
        provider: EVENT_LOG_PROVIDER,
        action: EVENT_LOG_ACTIONS.activeInstance,
      },
      kibana: { alerting: kibanaAlerting, alert: { flapping, uuid } },
    });
    return this;
  }

  addNewAlert(alertId: string, uuid: string): EventsFactory {
    this.events.push({
      '@timestamp': this.date,
      event: {
        provider: EVENT_LOG_PROVIDER,
        action: EVENT_LOG_ACTIONS.newInstance,
      },
      kibana: { alerting: { instance_id: alertId }, alert: { uuid } },
    });
    return this;
  }

  addRecoveredAlert(alertId: string, uuid: string): EventsFactory {
    this.events.push({
      '@timestamp': this.date,
      event: {
        provider: EVENT_LOG_PROVIDER,
        action: EVENT_LOG_ACTIONS.recoveredInstance,
      },
      kibana: { alerting: { instance_id: alertId }, alert: { uuid } },
    });
    return this;
  }

  addLegacyResolvedAlert(alertId: string, uuid: string): EventsFactory {
    this.events.push({
      '@timestamp': this.date,
      event: {
        provider: EVENT_LOG_PROVIDER,
        action: LEGACY_EVENT_LOG_ACTIONS.resolvedInstance,
      },
      kibana: { alerting: { instance_id: alertId }, alert: { uuid } },
    });
    return this;
  }

  getExecutionDurations(): Record<string, number> {
    return this.events
      .filter((ev) => ev?.event?.action === 'execute' && ev?.event?.duration !== undefined)
      .reduce((res: Record<string, number>, ev) => {
        res[ev?.['@timestamp']!] = nanosToMillis(ev?.event?.duration!);
        return res;
      }, {});
  }
}

function createRule(overrides: Partial<SanitizedRule>): SanitizedRule<{ bar: boolean }> {
  return { ...BaseRule, ...overrides };
}

const BaseRule: SanitizedRule<{ bar: boolean }> = {
  id: 'rule-123',
  alertTypeId: '123',
  schedule: { interval: '10s' },
  enabled: false,
  name: 'rule-name',
  tags: [],
  consumer: 'rule-consumer',
  throttle: null,
  notifyWhen: null,
  muteAll: false,
  mutedInstanceIds: [],
  params: { bar: true },
  actions: [],
  createdBy: null,
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  apiKeyOwner: null,
  executionStatus: {
    status: 'unknown',
    lastExecutionDate: new Date('2020-08-20T19:23:38Z'),
  },
  revision: 0,
};
