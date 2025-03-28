/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Boom from '@hapi/boom';

import type { BuildFlavor } from '@kbn/config/src/types';
import type {
  ISavedObjectsPointInTimeFinder,
  ISavedObjectsRepository,
  SavedObject,
} from '@kbn/core/server';
import type { LegacyUrlAliasTarget } from '@kbn/core-saved-objects-common';
import type { KibanaFeature } from '@kbn/features-plugin/common';
import { KibanaFeatureScope } from '@kbn/features-plugin/common';
import type { FeaturesPluginStart } from '@kbn/features-plugin/server';

import { isReservedSpace } from '../../common';
import type { spaceV1 as v1 } from '../../common';
import type { ConfigType } from '../config';
import { withSpaceSolutionDisabledFeatures } from '../lib/utils/space_solution_disabled_features';

const SUPPORTED_GET_SPACE_PURPOSES: v1.GetAllSpacesPurpose[] = [
  'any',
  'copySavedObjectsIntoSpace',
  'findSavedObjects',
  'shareSavedObjectsIntoSpace',
];
const DEFAULT_PURPOSE = 'any';
const LEGACY_URL_ALIAS_TYPE = 'legacy-url-alias';

/**
 * Client interface for interacting with spaces.
 */
export interface ISpacesClient {
  /**
   * Retrieve all available spaces.
   * @param options controls which spaces are retrieved.
   */
  getAll(options?: v1.GetAllSpacesOptions): Promise<v1.GetSpaceResult[]>;

  /**
   * Retrieve a space by its id.
   * @param id the space id.
   */
  get(id: string): Promise<v1.Space>;

  /**
   * Creates a space.
   * @param space the space to create.
   */
  create(space: v1.Space): Promise<v1.Space>;

  /**
   * Updates a space.
   * @param id  the id of the space to update.
   * @param space the updated space.
   */
  update(id: string, space: v1.Space): Promise<v1.Space>;

  /**
   * Returns a {@link ISavedObjectsPointInTimeFinder} to help page through
   * saved objects within the specified space.
   * @param id the id of the space to search.
   */
  createSavedObjectFinder(id: string): ISavedObjectsPointInTimeFinder<unknown, unknown>;

  /**
   * Deletes a space, and all saved objects belonging to that space.
   * @param id the id of the space to delete.
   */
  delete(id: string): Promise<void>;

  /**
   * Disables the specified legacy URL aliases.
   * @param aliases the aliases to disable.
   */
  disableLegacyUrlAliases(aliases: LegacyUrlAliasTarget[]): Promise<void>;
}

/**
 * Client for interacting with spaces.
 */
export class SpacesClient implements ISpacesClient {
  private readonly isServerless: boolean;

  /**
   * A map of deprecated feature IDs to the feature IDs that replace them used to transform the disabled features
   * of a space to make sure they only reference non-deprecated features.
   */
  private readonly deprecatedFeaturesReferences: Map<string, Set<string>>;

  constructor(
    private readonly debugLogger: (message: string) => void,
    private readonly config: ConfigType,
    private readonly repository: ISavedObjectsRepository,
    private readonly nonGlobalTypeNames: string[],
    private readonly buildFlavour: BuildFlavor,
    private readonly features: FeaturesPluginStart
  ) {
    this.isServerless = this.buildFlavour === 'serverless';
    this.deprecatedFeaturesReferences = this.collectDeprecatedFeaturesReferences(
      features.getKibanaFeatures()
    );
  }

  public async getAll(options: v1.GetAllSpacesOptions = {}): Promise<v1.GetSpaceResult[]> {
    const { purpose = DEFAULT_PURPOSE } = options;
    if (!SUPPORTED_GET_SPACE_PURPOSES.includes(purpose)) {
      throw Boom.badRequest(`unsupported space purpose: ${purpose}`);
    }

    this.debugLogger(`SpacesClient.getAll(). querying all spaces`);

    const { saved_objects: savedObjects } = await this.repository.find({
      type: 'space',
      page: 1,
      perPage: this.config.maxSpaces,
      sortField: 'name.keyword',
    });

    this.debugLogger(`SpacesClient.getAll(). Found ${savedObjects.length} spaces.`);

    return savedObjects.map(this.transformSavedObjectToSpace);
  }

  public async get(id: string) {
    const savedObject = await this.repository.get('space', id);
    return this.transformSavedObjectToSpace(savedObject);
  }

  public async create(space: v1.Space) {
    const { total } = await this.repository.find({
      type: 'space',
      page: 1,
      perPage: 0,
    });
    if (total >= this.config.maxSpaces) {
      throw Boom.badRequest(
        'Unable to create Space, this exceeds the maximum number of spaces set by the xpack.spaces.maxSpaces setting'
      );
    }

    if (space.disabledFeatures.length > 0 && !this.config.allowFeatureVisibility) {
      throw Boom.badRequest(
        'Unable to create Space, the disabledFeatures array must be empty when xpack.spaces.allowFeatureVisibility setting is disabled'
      );
    }

    if (Boolean(space.solution) && !this.config.allowSolutionVisibility) {
      throw Boom.badRequest(
        'Unable to create Space, the solution property can not be set when xpack.spaces.allowSolutionVisibility setting is disabled'
      );
    }

    if (this.isServerless && Object.hasOwn(space, 'solution')) {
      throw Boom.badRequest('Unable to create Space, solution property is forbidden in serverless');
    }

    if (Object.hasOwn(space, 'solution') && !space.solution) {
      throw Boom.badRequest('Unable to create Space, solution property cannot be empty');
    }

    this.validateDisabledFeatures(space);

    this.debugLogger(`SpacesClient.create(), using RBAC. Attempting to create space`);

    const id = space.id;
    const attributes = this.generateSpaceAttributes(space);

    const createdSavedObject = await this.repository.create('space', attributes, { id });

    this.debugLogger(`SpacesClient.create(), created space object`);

    return this.transformSavedObjectToSpace(createdSavedObject);
  }

  public async update(id: string, space: v1.Space) {
    if (space.disabledFeatures.length > 0 && !this.config.allowFeatureVisibility) {
      throw Boom.badRequest(
        'Unable to update Space, the disabledFeatures array must be empty when xpack.spaces.allowFeatureVisibility setting is disabled'
      );
    }

    if (Boolean(space.solution) && !this.config.allowSolutionVisibility) {
      throw Boom.badRequest(
        'Unable to update Space, the solution property can not be set when xpack.spaces.allowSolutionVisibility setting is disabled'
      );
    }

    if (this.isServerless && Object.hasOwn(space, 'solution')) {
      throw Boom.badRequest('Unable to update Space, solution property is forbidden in serverless');
    }

    if (Object.hasOwn(space, 'solution') && !space.solution) {
      throw Boom.badRequest('Unable to update Space, solution property cannot be empty');
    }

    this.validateDisabledFeatures(space);

    const attributes = this.generateSpaceAttributes(space);
    await this.repository.update('space', id, attributes);
    const updatedSavedObject = await this.repository.get('space', id);
    return this.transformSavedObjectToSpace(updatedSavedObject);
  }

  public createSavedObjectFinder(id: string) {
    return this.repository.createPointInTimeFinder({
      type: this.nonGlobalTypeNames,
      namespaces: [id],
    });
  }

  public async delete(id: string) {
    const existingSavedObject = await this.repository.get('space', id);
    if (isReservedSpace(this.transformSavedObjectToSpace(existingSavedObject))) {
      throw Boom.badRequest(`The ${id} space cannot be deleted because it is reserved.`);
    }

    await this.repository.deleteByNamespace(id);

    await this.repository.delete('space', id);
  }

  public async disableLegacyUrlAliases(aliases: LegacyUrlAliasTarget[]) {
    const attributes = { disabled: true };
    const objectsToUpdate = aliases.map(({ targetSpace, targetType, sourceId }) => {
      const id = `${targetSpace}:${targetType}:${sourceId}`;
      return { type: LEGACY_URL_ALIAS_TYPE, id, attributes };
    });
    await this.repository.bulkUpdate(objectsToUpdate);
  }

  private validateDisabledFeatures = (space: v1.Space) => {
    if (!space.disabledFeatures.length || this.isServerless) {
      return;
    }

    const kibanaFeatures = this.features.getKibanaFeatures();

    if (
      space.disabledFeatures.some((feature) => {
        const disabledKibanaFeature = kibanaFeatures.find((f) => f.id === feature);

        return (
          disabledKibanaFeature && !disabledKibanaFeature.scope?.includes(KibanaFeatureScope.Spaces)
        );
      })
    ) {
      throw Boom.badRequest(
        'Unable to create Space, one or more disabledFeatures do not have the required space scope'
      );
    }
  };

  private transformSavedObjectToSpace = (savedObject: SavedObject<any>): v1.Space => {
    // Solution isn't supported in the serverless offering.
    const solution = !this.isServerless ? savedObject.attributes.solution : undefined;
    return {
      id: savedObject.id,
      name: savedObject.attributes.name ?? '',
      description: savedObject.attributes.description,
      color: savedObject.attributes.color,
      initials: savedObject.attributes.initials,
      imageUrl: savedObject.attributes.imageUrl,
      disabledFeatures: withSpaceSolutionDisabledFeatures(
        this.features.getKibanaFeatures(),
        savedObject.attributes.disabledFeatures?.flatMap((featureId: string) =>
          Array.from(this.deprecatedFeaturesReferences.get(featureId) ?? [featureId])
        ) ?? [],
        solution
      ),
      _reserved: savedObject.attributes._reserved,
      ...(solution ? { solution } : {}),
    } as v1.Space;
  };

  private generateSpaceAttributes = (space: v1.Space) => {
    return {
      name: space.name,
      description: space.description,
      color: space.color,
      initials: space.initials,
      imageUrl: space.imageUrl,
      disabledFeatures: space.disabledFeatures,
      ...(!this.isServerless && space.solution ? { solution: space.solution } : {}),
    };
  };

  /**
   * Collects a map of all deprecated feature IDs and the feature IDs that replace them.
   * @param features A list of all available Kibana features including deprecated ones.
   */
  private collectDeprecatedFeaturesReferences(features: KibanaFeature[]) {
    const deprecatedFeatureReferences = new Map();
    for (const feature of features) {
      if (!feature.deprecated || !feature.scope?.includes(KibanaFeatureScope.Spaces)) {
        continue;
      }

      // If the feature is deprecated and replacement features are explicitly defined, use them.
      // Otherwise, use the replacement features defined in the feature privileges.
      const featureReplacedBy = feature.deprecated?.replacedBy;
      if (featureReplacedBy) {
        deprecatedFeatureReferences.set(feature.id, new Set(featureReplacedBy));
        continue;
      }

      // Collect all feature privileges including the ones provided by sub-features, if any.
      const allPrivileges = Object.values(feature.privileges ?? {}).concat(
        feature.subFeatures?.flatMap((subFeature) =>
          subFeature.privilegeGroups.flatMap(({ privileges }) => privileges)
        ) ?? []
      );

      // Collect all features IDs that are referenced by the deprecated feature privileges.
      const referencedFeaturesIds = new Set();
      for (const privilege of allPrivileges) {
        const replacedBy = privilege.replacedBy
          ? 'default' in privilege.replacedBy
            ? privilege.replacedBy.default.concat(privilege.replacedBy.minimal)
            : privilege.replacedBy
          : [];
        for (const privilegeReference of replacedBy) {
          referencedFeaturesIds.add(privilegeReference.feature);
        }
      }

      deprecatedFeatureReferences.set(feature.id, referencedFeaturesIds);
    }

    return deprecatedFeatureReferences;
  }
}
