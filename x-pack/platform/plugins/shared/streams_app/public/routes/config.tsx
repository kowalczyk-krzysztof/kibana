/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import { createRouter, Outlet, RouteMap } from '@kbn/typed-react-router-config';
import * as t from 'io-ts';
import React from 'react';
import { StreamDetailView } from '../components/stream_detail_view';
import { StreamsAppPageTemplate } from '../components/streams_app_page_template';
import { StreamsAppRouterBreadcrumb } from '../components/streams_app_router_breadcrumb';
import { RedirectTo } from '../components/redirect_to';
import { StreamListView } from '../components/stream_list_view';
import { StreamManagementView } from '../components/stream_management_view';
import { StreamDetailRoot } from '../components/stream_root';

/**
 * The array of route definitions to be used when the application
 * creates the routes.
 */
const streamsAppRoutes = {
  '/': {
    element: (
      <StreamsAppRouterBreadcrumb
        title={i18n.translate('xpack.streams.appBreadcrumbTitle', {
          defaultMessage: 'Streams',
        })}
        path="/"
      >
        <StreamsAppPageTemplate>
          <Outlet />
        </StreamsAppPageTemplate>
      </StreamsAppRouterBreadcrumb>
    ),
    children: {
      '/': {
        element: <StreamListView />,
      },
      '/{key}': {
        element: (
          <StreamDetailRoot>
            <Outlet />
          </StreamDetailRoot>
        ),
        params: t.type({
          path: t.type({
            key: t.string,
          }),
        }),
        children: {
          '/{key}': {
            element: <RedirectTo path="/{key}/{tab}" params={{ path: { tab: 'overview' } }} />,
          },
          '/{key}/{tab}': {
            element: <StreamDetailView />,
            params: t.type({
              path: t.type({
                tab: t.string,
              }),
            }),
          },
          '/{key}/management/{tab}': {
            element: <StreamManagementView />,
            params: t.type({
              path: t.type({
                tab: t.string,
              }),
            }),
          },
        },
      },
    },
  },
} satisfies RouteMap;

export type StreamsAppRoutes = typeof streamsAppRoutes;

export const streamsAppRouter = createRouter(streamsAppRoutes);

export type StreamsAppRouter = typeof streamsAppRouter;
