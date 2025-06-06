/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  IndicesIndexSettings,
  IngestDeletePipelineResponse,
  MappingTypeMapping,
} from '@elastic/elasticsearch/lib/api/types';

import type {
  ImportFailure,
  IngestPipeline,
  ImportDoc,
  InitializeImportResponse,
} from '../../common/types';

export interface ImportConfig {
  settings: IndicesIndexSettings;
  mappings: MappingTypeMapping;
  pipeline: IngestPipeline;
}

export interface ImportResults {
  success: boolean;
  failures?: ImportFailure[];
  docCount?: number;
  error?: any;
}

export interface CreateDocsResponse<T extends ImportDoc> {
  success: boolean;
  remainder: number;
  docs: T[];
  error?: any;
}

export interface ImportFactoryOptions {
  excludeLinesPattern?: string;
  multilineStartPattern?: string;
}

export interface IImporter {
  read(data: ArrayBuffer): { success: boolean };
  initializeImport(
    index: string,
    settings: IndicesIndexSettings,
    mappings: MappingTypeMapping,
    pipeline: Array<IngestPipeline | undefined>,
    existingIndex?: boolean
  ): Promise<InitializeImportResponse>;
  initializeWithoutCreate(
    index: string,
    mappings: MappingTypeMapping,
    pipelines: IngestPipeline[]
  ): void;
  import(
    index: string,
    ingestPipelineId: string | undefined,
    setImportProgress: (progress: number) => void
  ): Promise<ImportResults>;
  initialized(): boolean;
  getIndex(): string | undefined;
  getTimeField(): string | undefined;
  previewIndexTimeRange(): Promise<{ start: number | null; end: number | null }>;
  deletePipelines(): Promise<IngestDeletePipelineResponse[]>;
}
