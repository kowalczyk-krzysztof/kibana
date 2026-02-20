/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { SettingsStart } from '@kbn/core-ui-settings-browser';
import type { FeedbackStart, FeedbackAction } from '@kbn/core-notifications-browser';

interface StartDeps {
  settings: SettingsStart;
}

export class FeedbackService {
  private settings?: SettingsStart;
  private feedbackAction?: FeedbackAction;

  public start({ settings }: StartDeps): FeedbackStart {
    this.settings = settings;

    return {
      isEnabled: () => {
        return !this.settings?.globalClient.get<boolean>('hideFeedback', false);
      },
      registerFeedbackAction: (action: FeedbackAction) => {
        this.feedbackAction = action;
      },
    };
  }

  /**
   * @internal
   * Returns the registered feedback action, or undefined if none is registered.
   * Used by ErrorToast to conditionally show the feedback button.
   */
  public getFeedbackAction(): FeedbackAction | undefined {
    return this.feedbackAction;
  }
}
