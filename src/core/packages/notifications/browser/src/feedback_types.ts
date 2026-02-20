/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

/**
 * Callback function to open the feedback modal.
 * @public
 */
export type FeedbackAction = () => void;

/**
 * Exposes public API of the Feedback service during the start phase.
 * @public
 */
export interface FeedbackStart {
  /**
   * Returns whether feedback elements are allowed to be shown.
   */
  isEnabled(): boolean;

  /**
   * Registers a callback that will be invoked when the user clicks
   * the feedback button on error toasts.
   * This allows plugins (like the feedback plugin) to provide the
   * actual feedback modal implementation without core depending on them.
   */
  registerFeedbackAction(action: FeedbackAction): void;
}
