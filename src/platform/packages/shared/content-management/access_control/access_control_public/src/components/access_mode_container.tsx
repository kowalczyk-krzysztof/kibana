/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { type ChangeEvent, useState, useEffect } from 'react';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import type { SavedObjectAccessControl } from '@kbn/core-saved-objects-common';
import type { Space } from '@kbn/spaces-plugin/common';
import type { GetUserProfileResponse } from '@kbn/security-plugin/common';
import type { UserProfileData } from '@kbn/user-profile-components';
import type { AccessControlClient } from '../access_control_client';

const selectOptions = [
  {
    value: 'default',
    text: (
      <FormattedMessage
        id="contentManagement.accessControl.accessMode.container.select.options.isEditable"
        defaultMessage="Can edit"
      />
    ),
  },
  {
    value: 'read_only',
    text: (
      <FormattedMessage
        id="contentManagement.accessControl.accessMode.container.select.options.isReadOnly"
        defaultMessage="Can view"
      />
    ),
  },
];

interface Props {
  onChangeAccessMode: (value: SavedObjectAccessControl['accessMode']) => Promise<void> | void;
  getActiveSpace?: () => Promise<Space>;
  getCurrentUser: () => Promise<GetUserProfileResponse<UserProfileData>>;
  accessControlClient: AccessControlClient;
  entityName: string;
  accessControl?: Partial<SavedObjectAccessControl>;
  createdBy?: string;
}

export const AccessModeContainer = ({
  onChangeAccessMode,
  getActiveSpace,
  getCurrentUser,
  accessControlClient,
  entityName,
  accessControl,
  createdBy,
}: Props) => {
  const [spaceName, setSpaceName] = useState('');
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const [canManageAccessControl, setCanManageAccessControl] = useState(false);
  const isInEditAccessMode = accessControlClient.isInEditAccessMode(accessControl);

  useEffect(() => {
    getActiveSpace?.().then((activeSpace) => {
      setSpaceName(activeSpace.name);
    });
  }, [getActiveSpace]);

  useEffect(() => {
    const getCanManage = async () => {
      const user = await getCurrentUser();
      const canManage = await accessControlClient.canManageAccessControl({
        accessControl,
        createdBy,
        uid: user?.uid,
        contentTypeId: entityName,
      });
      setCanManageAccessControl(canManage);
    };

    getCanManage();
  }, [accessControl, createdBy, accessControlClient, entityName, getCurrentUser]);

  const selectId = useGeneratedHtmlId({ prefix: 'accessControlSelect' });

  const handleSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    setIsUpdatingPermissions(true);
    await onChangeAccessMode(e.target.value as SavedObjectAccessControl['accessMode']);
    setIsUpdatingPermissions(false);
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="s" data-test-subj="accessModeContainer">
      <EuiFlexItem>
        <EuiTitle size="xs">
          <h4>
            <FormattedMessage
              id="contentManagement.accessControl.accessMode.container.title"
              defaultMessage="Permissions"
            />
          </h4>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFlexGroup direction="row" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiFlexGroup direction="row" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <FormattedMessage
                    id="contentManagement.accessControl.accessMode.container.description.content"
                    defaultMessage="Everybody in the space"
                  />
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiBadge iconType="logoSecurity" color="hollow">
                  {spaceName}
                </EuiBadge>
              </EuiFlexItem>
              {!canManageAccessControl && (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <FormattedMessage
                        id="contentManagement.accessControl.accessMode.container.description.permissionType"
                        defaultMessage="can {permissionType}"
                        values={{
                          permissionType: isInEditAccessMode ? 'edit' : 'view',
                        }}
                      />
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} data-test-subj="accessModeContainerDescriptionTooltip">
                    <EuiIconTip
                      type="info"
                      content={
                        <FormattedMessage
                          id="contentManagement.accessControl.accessMode.container.description.tooltipContent"
                          defaultMessage="Only the {entityName} author can edit permissions."
                          values={{ entityName }}
                        />
                      }
                      aria-label={i18n.translate(
                        'contentManagement.accessControl.accessMode.container.description.tooltipAriaLabel',
                        {
                          defaultMessage: 'Only the {entityName} author can edit permissions.',
                          values: { entityName },
                        }
                      )}
                      position="bottom"
                    />
                  </EuiFlexItem>
                </>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {canManageAccessControl && (
              <EuiSelect
                id={selectId}
                isLoading={isUpdatingPermissions}
                disabled={isUpdatingPermissions}
                data-test-subj="accessModeSelect"
                options={selectOptions}
                defaultValue={accessControl?.accessMode ?? 'default'}
                onChange={handleSelectChange}
                aria-label={i18n.translate(
                  'contentManagement.accessControl.accessMode.container.select.ariaLabel',
                  {
                    defaultMessage: 'Modify access acess mode for the {entityName}.',
                    values: { entityName },
                  }
                )}
              />
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiSpacer size="m" />
    </EuiFlexGroup>
  );
};
