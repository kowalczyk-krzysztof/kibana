/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RouteSecurity } from '@kbn/core-http-server';

import { parseExperimentalConfigValue } from '../../../common/experimental_features';
import { API_VERSIONS } from '../../../common/constants';
import type { FleetAuthz } from '../../../common';

import {
  calculateRouteAuthz,
  type FleetAuthzRouter,
  getRouteRequiredAuthz,
} from '../../services/security';
import type { FleetAuthzRouteConfig } from '../../services/security/types';

import { EPM_API_ROUTES } from '../../constants';
import {
  GetCategoriesRequestSchema,
  GetPackagesRequestSchema,
  GetInstalledPackagesRequestSchema,
  GetFileRequestSchema,
  GetInfoRequestSchema,
  GetBulkAssetsRequestSchema,
  InstallPackageFromRegistryRequestSchema,
  InstallPackageByUploadRequestSchema,
  DeletePackageRequestSchema,
  BulkInstallPackagesFromRegistryRequestSchema,
  GetStatsRequestSchema,
  UpdatePackageRequestSchema,
  ReauthorizeTransformRequestSchema,
  GetDataStreamsRequestSchema,
  CreateCustomIntegrationRequestSchema,
  GetInputsRequestSchema,
  InstallKibanaAssetsRequestSchema,
  DeleteKibanaAssetsRequestSchema,
  GetCategoriesResponseSchema,
  GetPackagesResponseSchema,
  GetInstalledPackagesResponseSchema,
  GetLimitedPackagesResponseSchema,
  GetStatsResponseSchema,
  GetInputsResponseSchema,
  GetFileResponseSchema,
  GetInfoResponseSchema,
  UpdatePackageResponseSchema,
  InstallPackageResponseSchema,
  InstallKibanaAssetsResponseSchema,
  BulkInstallPackagesFromRegistryResponseSchema,
  DeletePackageResponseSchema,
  GetVerificationKeyIdResponseSchema,
  GetDataStreamsResponseSchema,
  GetBulkAssetsResponseSchema,
  ReauthorizeTransformResponseSchema,
  BulkUpgradePackagesRequestSchema,
  BulkUpgradePackagesResponseSchema,
  GetOneBulkOperationPackagesRequestSchema,
  GetOneBulkOperationPackagesResponseSchema,
  BulkUninstallPackagesRequestSchema,
  CustomIntegrationRequestSchema,
  DeletePackageDatastreamAssetsRequestSchema,
  DeletePackageDatastreamAssetsResponseSchema,
  RollbackPackageRequestSchema,
  RollbackPackageResponseSchema,
} from '../../types';
import type { FleetConfigType } from '../../config';
import { FLEET_API_PRIVILEGES } from '../../constants/api_privileges';
import { genericErrorResponse } from '../schema/errors';

import {
  getCategoriesHandler,
  getListHandler,
  getInstalledListHandler,
  getLimitedListHandler,
  getInfoHandler,
  getBulkAssetsHandler,
  installPackageFromRegistryHandler,
  installPackageByUploadHandler,
  deletePackageHandler,
  bulkInstallPackagesFromRegistryHandler,
  getStatsHandler,
  updatePackageHandler,
  getVerificationKeyIdHandler,
  reauthorizeTransformsHandler,
  getDataStreamsHandler,
  createCustomIntegrationHandler,
  getInputsHandler,
  updateCustomIntegrationHandler,
  rollbackPackageHandler,
} from './handlers';
import { getFileHandler } from './file_handler';
import {
  deletePackageKibanaAssetsHandler,
  installPackageKibanaAssetsHandler,
} from './kibana_assets_handler';
import {
  postBulkUpgradePackagesHandler,
  postBulkUninstallPackagesHandler,
  getOneBulkOperationPackagesHandler,
} from './bulk_handler';
import { deletePackageDatastreamAssetsHandler } from './package_datastream_assets_handler';

const MAX_FILE_SIZE_BYTES = 104857600; // 100MB

export const INSTALL_PACKAGES_AUTHZ: FleetAuthzRouteConfig['fleetAuthz'] = {
  integrations: { installPackages: true },
};

export const INSTALL_PACKAGES_SECURITY: RouteSecurity = {
  authz: {
    requiredPrivileges: [
      FLEET_API_PRIVILEGES.INTEGRATIONS.ALL,
      FLEET_API_PRIVILEGES.AGENT_POLICIES.ALL,
    ],
  },
};

export const READ_PACKAGE_INFO_AUTHZ: FleetAuthzRouteConfig['fleetAuthz'] = {
  integrations: { readPackageInfo: true },
};

export const READ_PACKAGE_INFO_SECURITY: RouteSecurity = {
  authz: {
    requiredPrivileges: [
      {
        anyRequired: [
          FLEET_API_PRIVILEGES.INTEGRATIONS.READ,
          FLEET_API_PRIVILEGES.SETUP,
          FLEET_API_PRIVILEGES.FLEET.ALL,
        ],
      },
    ],
  },
};

export const registerRoutes = (router: FleetAuthzRouter, config: FleetConfigType) => {
  const experimentalFeatures = parseExperimentalConfigValue(config.enableExperimental);

  router.versioned
    .get({
      path: EPM_API_ROUTES.CATEGORIES_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get package categories`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetCategoriesRequestSchema,
          response: {
            200: {
              body: () => GetCategoriesResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getCategoriesHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.LIST_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get packages`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetPackagesRequestSchema,
          response: {
            200: {
              body: () => GetPackagesResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getListHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.INSTALLED_LIST_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get installed packages`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetInstalledPackagesRequestSchema,
          response: {
            200: {
              body: () => GetInstalledPackagesResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getInstalledListHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.LIMITED_LIST_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get a limited package list`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: {},
          response: {
            200: {
              body: () => GetLimitedPackagesResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getLimitedListHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.STATS_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get package stats`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetStatsRequestSchema,
          response: {
            200: {
              body: () => GetStatsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getStatsHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.INPUTS_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get an inputs template`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetInputsRequestSchema,
          response: {
            200: {
              body: () => GetInputsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getInputsHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.FILEPATH_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get a package file`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetFileRequestSchema,
          response: {
            200: {
              body: () => GetFileResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getFileHandler
    );

  router.versioned
    // @ts-ignore TODO move to kibana authz https://github.com/elastic/kibana/issues/203170
    .get({
      path: EPM_API_ROUTES.INFO_PATTERN,
      fleetAuthz: (fleetAuthz: FleetAuthz): boolean =>
        calculateRouteAuthz(fleetAuthz, getRouteRequiredAuthz('get', EPM_API_ROUTES.INFO_PATTERN))
          .granted,
      summary: `Get a package`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetInfoRequestSchema,
          response: {
            200: {
              body: () => GetInfoResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getInfoHandler
    );

  router.versioned
    .put({
      path: EPM_API_ROUTES.INFO_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Update package settings`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: UpdatePackageRequestSchema,
          response: {
            200: {
              body: () => UpdatePackageResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      updatePackageHandler
    );

  router.versioned
    .post({
      path: EPM_API_ROUTES.INSTALL_FROM_REGISTRY_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Install a package from the registry`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: InstallPackageFromRegistryRequestSchema,
          response: {
            200: {
              body: () => InstallPackageResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      installPackageFromRegistryHandler
    );

  router.versioned
    .post({
      path: EPM_API_ROUTES.INSTALL_KIBANA_ASSETS_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Install Kibana assets for a package`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: InstallKibanaAssetsRequestSchema,
          response: {
            200: {
              body: () => InstallKibanaAssetsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      installPackageKibanaAssetsHandler
    );

  router.versioned
    .delete({
      path: EPM_API_ROUTES.DELETE_KIBANA_ASSETS_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Delete Kibana assets for a package`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: DeleteKibanaAssetsRequestSchema,
          response: {
            200: {
              body: () => InstallKibanaAssetsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      deletePackageKibanaAssetsHandler
    );

  if (experimentalFeatures.installedIntegrationsTabularUI) {
    router.versioned
      .post({
        path: EPM_API_ROUTES.BULK_UPGRADE_PATTERN,
        security: INSTALL_PACKAGES_SECURITY,
        summary: `Bulk upgrade packages`,
        options: {
          tags: ['oas-tag:Elastic Package Manager (EPM)'],
        },
      })
      .addVersion(
        {
          version: API_VERSIONS.public.v1,
          validate: {
            request: BulkUpgradePackagesRequestSchema,
            response: {
              200: {
                body: () => BulkUpgradePackagesResponseSchema,
              },
              400: {
                body: genericErrorResponse,
              },
            },
          },
        },
        postBulkUpgradePackagesHandler
      );

    router.versioned
      .post({
        path: EPM_API_ROUTES.BULK_UNINSTALL_PATTERN,
        security: INSTALL_PACKAGES_SECURITY,
        summary: `Bulk uninstall packages`,
        options: {
          tags: ['oas-tag:Elastic Package Manager (EPM)'],
        },
      })
      .addVersion(
        {
          version: API_VERSIONS.public.v1,
          validate: {
            request: BulkUninstallPackagesRequestSchema,
            response: {
              200: {
                body: () => BulkUpgradePackagesResponseSchema,
              },
              400: {
                body: genericErrorResponse,
              },
            },
          },
        },
        postBulkUninstallPackagesHandler
      );

    router.versioned
      .get({
        path: EPM_API_ROUTES.BULK_UNINSTALL_INFO_PATTERN,
        security: INSTALL_PACKAGES_SECURITY,
        summary: `Get Bulk uninstall packages details`,
        options: {
          tags: ['oas-tag:Elastic Package Manager (EPM)'],
        },
      })
      .addVersion(
        {
          version: API_VERSIONS.public.v1,
          validate: {
            request: GetOneBulkOperationPackagesRequestSchema,
            response: {
              200: {
                body: () => GetOneBulkOperationPackagesResponseSchema,
              },
              400: {
                body: genericErrorResponse,
              },
            },
          },
        },
        getOneBulkOperationPackagesHandler
      );

    router.versioned
      .get({
        path: EPM_API_ROUTES.BULK_UPGRADE_INFO_PATTERN,
        security: INSTALL_PACKAGES_SECURITY,
        summary: `Get Bulk upgrade packages details`,
        options: {
          tags: ['oas-tag:Elastic Package Manager (EPM)'],
        },
      })
      .addVersion(
        {
          version: API_VERSIONS.public.v1,
          validate: {
            request: GetOneBulkOperationPackagesRequestSchema,
            response: {
              200: {
                body: () => GetOneBulkOperationPackagesResponseSchema,
              },
              400: {
                body: genericErrorResponse,
              },
            },
          },
        },
        getOneBulkOperationPackagesHandler
      );
  }

  router.versioned
    .post({
      path: EPM_API_ROUTES.BULK_INSTALL_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Bulk install packages`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: BulkInstallPackagesFromRegistryRequestSchema,
          response: {
            200: {
              body: () => BulkInstallPackagesFromRegistryResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      bulkInstallPackagesFromRegistryHandler
    );

  // Only allow upload for superuser
  router.versioned
    .post({
      path: EPM_API_ROUTES.INSTALL_BY_UPLOAD_PATTERN,
      options: {
        body: {
          accepts: ['application/gzip', 'application/zip'],
          parse: false,
          maxBytes: MAX_FILE_SIZE_BYTES,
        },
        tags: [`oas-tag:Elastic Package Manager (EPM)`],
      },
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Install a package by upload`,
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: InstallPackageByUploadRequestSchema,
          response: {
            200: {
              body: () => InstallPackageResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      installPackageByUploadHandler
    );

  router.versioned
    .post({
      path: EPM_API_ROUTES.CUSTOM_INTEGRATIONS_PATTERN,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Create a custom integration`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: CreateCustomIntegrationRequestSchema,
          response: {
            200: {
              body: () => InstallPackageResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      createCustomIntegrationHandler
    );

  router.versioned
    .delete({
      path: EPM_API_ROUTES.DELETE_PATTERN,
      security: {
        authz: {
          requiredPrivileges: [
            FLEET_API_PRIVILEGES.INTEGRATIONS.ALL,
            FLEET_API_PRIVILEGES.AGENT_POLICIES.ALL,
          ],
        },
      },
      summary: `Delete a package`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: DeletePackageRequestSchema,
          response: {
            200: {
              body: () => DeletePackageResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },

      deletePackageHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.VERIFICATION_KEY_ID,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get a package signature verification key ID`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: {},
          response: {
            200: {
              body: () => GetVerificationKeyIdResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getVerificationKeyIdHandler
    );

  router.versioned
    .get({
      path: EPM_API_ROUTES.DATA_STREAMS_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Get data streams`,
      options: {
        tags: ['oas-tag:Data streams'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetDataStreamsRequestSchema,
          response: {
            200: {
              body: () => GetDataStreamsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getDataStreamsHandler
    );

  router.versioned
    .post({
      path: EPM_API_ROUTES.BULK_ASSETS_PATTERN,
      security: READ_PACKAGE_INFO_SECURITY,
      summary: `Bulk get assets`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: GetBulkAssetsRequestSchema,
          response: {
            200: {
              body: () => GetBulkAssetsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      getBulkAssetsHandler
    );

  // Update transforms with es-secondary-authorization headers,
  // append authorized_by to transform's _meta, and start transforms
  router.versioned
    // @ts-ignore TODO move to kibana authz https://github.com/elastic/kibana/issues/203170
    .post({
      path: EPM_API_ROUTES.REAUTHORIZE_TRANSFORMS,
      fleetAuthz: {
        ...INSTALL_PACKAGES_AUTHZ,
        packagePrivileges: {
          transform: {
            actions: {
              canStartStopTransform: {
                executePackageAction: true,
              },
            },
          },
        },
      },
      summary: `Authorize transforms`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: ReauthorizeTransformRequestSchema,
          response: {
            200: {
              body: () => ReauthorizeTransformResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      reauthorizeTransformsHandler
    );

  router.versioned
    .put({
      path: EPM_API_ROUTES.UPDATE_CUSTOM_INTEGRATIONS_PATTERN,
      security: {
        authz: {
          requiredPrivileges: [
            FLEET_API_PRIVILEGES.SETTINGS.ALL,
            FLEET_API_PRIVILEGES.INTEGRATIONS.ALL,
          ],
        },
      },
      summary: `Update a custom integration`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: CustomIntegrationRequestSchema,
          response: {
            200: {},
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      updateCustomIntegrationHandler
    );

  router.versioned
    .delete({
      path: EPM_API_ROUTES.PACKAGES_DATASTREAM_ASSETS,
      security: INSTALL_PACKAGES_SECURITY,
      summary: `Delete assets for an input package`,
      options: {
        tags: ['oas-tag:Elastic Package Manager (EPM)'],
      },
    })
    .addVersion(
      {
        version: API_VERSIONS.public.v1,
        validate: {
          request: DeletePackageDatastreamAssetsRequestSchema,
          response: {
            200: {
              body: () => DeletePackageDatastreamAssetsResponseSchema,
            },
            400: {
              body: genericErrorResponse,
            },
          },
        },
      },
      deletePackageDatastreamAssetsHandler
    );

  if (experimentalFeatures.enablePackageRollback) {
    router.versioned
      .post({
        path: EPM_API_ROUTES.ROLLBACK_PATTERN,
        security: INSTALL_PACKAGES_SECURITY,
        summary: `Rollback a package to previous version`,
        options: {
          tags: ['oas-tag:Elastic Package Manager (EPM)'],
          availability: {
            since: '9.1.0',
            stability: 'experimental',
          },
        },
      })
      .addVersion(
        {
          version: API_VERSIONS.public.v1,
          validate: {
            request: RollbackPackageRequestSchema,
            response: {
              200: {
                body: () => RollbackPackageResponseSchema,
              },
              400: {
                body: genericErrorResponse,
              },
            },
          },
        },
        rollbackPackageHandler
      );
  }
};
