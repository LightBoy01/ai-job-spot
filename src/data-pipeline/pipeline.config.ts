import { hiringCafeSource } from './sources/hiringCafe.js';
import { IJobSource } from './types.js';

/**
 * An array of all job source modules to be processed by the pipeline.
 * To add a new source, simply import it and add it to this array.
 */
export const SOURCES_TO_RUN: IJobSource[] = [
  hiringCafeSource,
];

/**
 * A configuration object for source-specific settings.
 * The key should match the 'name' property of the job source.
 */
export const SOURCE_CONFIG = {
  'hiring.cafe': {
    maxPages: 5,
  },
  // To add configuration for a new source, add a new key-value pair here.
  // 'new-source-name': {
  //   setting: 'value',
  // },
};
