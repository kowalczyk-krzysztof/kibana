/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { renderWithI18n } from '@kbn/test-jest-helpers';

import { ErrorToast } from './error_toast';
import { renderingServiceMock } from '@kbn/core-rendering-browser-mocks';

interface ErrorToastProps {
  error?: Error;
  title?: string;
  toastMessage?: string;
  getFeedbackAction?: () => (() => void) | undefined;
}

let openModal: jest.Mock;
const mockRendering = renderingServiceMock.create();

beforeEach(() => (openModal = jest.fn()));

function getErrorToast(props: ErrorToastProps = {}) {
  return (
    <ErrorToast
      openModal={openModal}
      error={props.error || new Error('error message')}
      title={props.title || 'An error occured'}
      toastMessage={props.toastMessage || 'This is the toast message'}
      rendering={mockRendering}
      getFeedbackAction={props.getFeedbackAction || (() => undefined)}
    />
  );
}

it('renders matching snapshot', () => {
  expect(render(getErrorToast()).container.innerHTML).toMatchSnapshot();
});

it('should open a modal when clicking button', () => {
  const { getByTestId } = renderWithI18n(getErrorToast());
  expect(openModal).not.toHaveBeenCalled();
  fireEvent.click(getByTestId('errorToastBtn'));
  expect(openModal).toHaveBeenCalled();
});

it('should render feedback button when getFeedbackAction returns a function', () => {
  const mockFeedbackAction = jest.fn();
  const { getByTestId } = renderWithI18n(
    getErrorToast({ getFeedbackAction: () => mockFeedbackAction })
  );
  expect(getByTestId('errorToastFeedbackBtn')).toBeInTheDocument();
});

it('should not render feedback button when getFeedbackAction returns undefined', () => {
  const { queryByTestId } = renderWithI18n(getErrorToast({ getFeedbackAction: () => undefined }));
  expect(queryByTestId('errorToastFeedbackBtn')).not.toBeInTheDocument();
});

it('should call feedback action when clicking feedback button', () => {
  const mockFeedbackAction = jest.fn();
  const { getByTestId } = renderWithI18n(
    getErrorToast({ getFeedbackAction: () => mockFeedbackAction })
  );
  fireEvent.click(getByTestId('errorToastFeedbackBtn'));
  expect(mockFeedbackAction).toHaveBeenCalled();
});

afterAll(() => {
  // Cleanup document.body to cleanup any modals which might be left over from tests.
  document.body.innerHTML = '';
});
