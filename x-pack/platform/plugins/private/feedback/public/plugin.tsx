/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import type { CoreSetup, CoreStart, Plugin } from '@kbn/core/public';
import type { CloudSetup, CloudStart } from '@kbn/cloud-plugin/public';
import type { TelemetryPluginStart } from '@kbn/telemetry-plugin/public';
import type { SpacesPluginStart } from '@kbn/spaces-plugin/public';
import type { FeedbackRegistryEntry } from '@kbn/feedback-registry';
import { getFeedbackQuestionsForApp } from '@kbn/feedback-registry';
import { mountReactNode } from '@kbn/core-mount-utils-browser-internal';
import type { FeedbackFormData } from '../common';
import { getAppDetails } from './src/utils';

interface FeedbackPluginSetupDependencies {
  cloud?: CloudSetup;
}

interface FeedbackPluginStartDependencies {
  telemetry: TelemetryPluginStart;
  cloud?: CloudStart;
  spaces?: SpacesPluginStart;
}

export class FeedbackPlugin implements Plugin {
  private organizationId?: string;

  public setup(_core: CoreSetup, { cloud }: FeedbackPluginSetupDependencies) {
    this.organizationId = cloud?.organizationId;
    return {};
  }

  public start(core: CoreStart, { cloud, telemetry, spaces }: FeedbackPluginStartDependencies) {
    const isFeedbackEnabled = core.notifications.feedback.isEnabled();
    const isTelemetryEnabled = telemetry.telemetryService.canSendTelemetry();
    const isOptedIn = telemetry.telemetryService.getIsOptedIn();

    if (!isFeedbackEnabled || !isTelemetryEnabled || !isOptedIn) {
      return {};
    }

    // Helper functions shared between nav control and error toast feedback
    const getSolution = async (): Promise<string> => {
      try {
        const space = await spaces?.getActiveSpace();
        return space?.solution || cloud?.serverless?.projectType || 'classic';
      } catch {
        return cloud?.serverless?.projectType || 'classic';
      }
    };

    const getAppDetailsWrapper = () => {
      return getAppDetails(core);
    };

    const getQuestions = (appId: string): FeedbackRegistryEntry[] => {
      return getFeedbackQuestionsForApp(appId);
    };

    const getCurrentUserEmail = async (): Promise<string | undefined> => {
      if (!core.security) {
        return undefined;
      }
      try {
        const user = await core.security.authc.getCurrentUser();
        return user?.email;
      } catch {
        return;
      }
    };

    const sendFeedback = async (data: FeedbackFormData) => {
      const solution = await getSolution();
      await core.http.post('/internal/feedback/send', {
        body: JSON.stringify({ ...data, solution, organization_id: this.organizationId }),
      });
    };

    const showToast = (title: string, color: 'success' | 'error') => {
      if (color === 'success') {
        core.notifications.toasts.addSuccess({ title });
      }
      if (color === 'error') {
        core.notifications.toasts.addError(new Error(title), {
          title,
        });
      }
    };

    const checkTelemetryOptIn = async (): Promise<boolean> => {
      try {
        const telemetryConfig = await core.http.get<{ optIn: boolean | null }>(
          '/internal/telemetry/config',
          { version: '2' }
        );
        return telemetryConfig.optIn === true;
      } catch {
        return false;
      }
    };

    // Register feedback action for error toasts
    const openFeedbackModal = () => {
      import('@kbn/feedback-components').then(({ FeedbackContainer }) => {
        const modal = core.overlays.openModal(
          mountReactNode(
            core.rendering.addContext(
              <FeedbackContainer
                getAppDetails={getAppDetailsWrapper}
                getQuestions={getQuestions}
                getCurrentUserEmail={getCurrentUserEmail}
                sendFeedback={sendFeedback}
                showToast={showToast}
                hideFeedbackContainer={() => modal.close()}
              />
            )
          )
        );
      });
    };

    core.notifications.feedback.registerFeedbackAction(openFeedbackModal);

    // Register nav control
    core.chrome.navControls.registerRight({
      order: 1001,
      mount: (element) => {
        import('@kbn/feedback-components').then(({ FeedbackTriggerButton }) => {
          ReactDOM.render(
            core.rendering.addContext(
              <FeedbackTriggerButton
                getQuestions={getQuestions}
                getAppDetails={getAppDetailsWrapper}
                getCurrentUserEmail={getCurrentUserEmail}
                sendFeedback={sendFeedback}
                showToast={showToast}
                checkTelemetryOptIn={checkTelemetryOptIn}
              />
            ),
            element
          );
        });

        return () => {
          ReactDOM.unmountComponentAtNode(element);
        };
      },
    });

    return {};
  }

  public stop() {}
}
