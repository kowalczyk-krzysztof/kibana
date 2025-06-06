/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { ReactNode, KeyboardEvent } from 'react';
import PropTypes from 'prop-types';
// @ts-expect-error no @types definition
import { Shortcuts } from 'react-shortcuts';
import { isTextInput } from '../../../lib/is_text_input';
import { forceReload } from '../../hooks/use_canvas_api';

interface ChildrenProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

interface Props {
  isFullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;

  autoplayEnabled: boolean;
  toggleAutoplay: () => void;

  onPageChange: (pageNumber: number) => void;
  previousPage: () => void;
  nextPage: () => void;

  fetchAllRenderables: () => void;

  children: (props: ChildrenProps) => ReactNode;
}

export class FullscreenControl extends React.PureComponent<Props> {
  static propTypes = {
    setFullscreen: PropTypes.func.isRequired,
    isFullscreen: PropTypes.bool.isRequired,
    children: PropTypes.func.isRequired,
  };

  /*
    We need these instance functions because ReactShortcuts bind the handlers on it's mount, 
    but then does no rebinding if it's props change. Using these instance functions will 
    properly handle changes to incoming props since the instance functions are bound to the components
    "this" context
  */
  _toggleFullscreen = () => {
    const { setFullscreen, isFullscreen } = this.props;
    setFullscreen(!isFullscreen);
  };

  toggleAutoplay = () => {
    this.props.toggleAutoplay();
  };

  nextPage = () => {
    this.props.nextPage();
  };

  previousPage = () => {
    this.props.previousPage();
  };

  // handle keypress events for presentation events
  _keyMap: { [key: string]: (...args: any[]) => void } = {
    REFRESH: () => {
      forceReload();
      this.props.fetchAllRenderables();
    },
    PREV: this.previousPage,
    NEXT: this.nextPage,
    FULLSCREEN: this._toggleFullscreen,
    FULLSCREEN_EXIT: this._toggleFullscreen,
    PAGE_CYCLE_TOGGLE: this.toggleAutoplay,
  };

  _keyHandler = (action: string, event: KeyboardEvent) => {
    if (Object.keys(this._keyMap).indexOf(action) < 0) {
      return;
    }

    if (
      !isTextInput(event.target as HTMLInputElement) &&
      typeof this._keyMap[action] === 'function'
    ) {
      event.preventDefault();
      this._keyMap[action]();
    }
  };

  render() {
    const { children, isFullscreen } = this.props;

    return (
      <span>
        {isFullscreen && (
          <Shortcuts
            name="PRESENTATION"
            handler={this._keyHandler}
            targetNodeSelector="body"
            global
            isolate
          />
        )}
        {children({ isFullscreen, toggleFullscreen: this._toggleFullscreen })}
      </span>
    );
  }
}
