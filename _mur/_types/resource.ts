/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Types related to server-based resources that are accessed through
  a data adapter or dataset manager.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import type { PropName, UR_SchemaID } from './ursys.ts';

/// RESOURCE TYPES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Resources are file-based data structures that conform to a schema */
export type ResourceUID = string; // unique snake_case resource identifier
export type ResourceKey = string; // non-unique resource URI
export type ManifestItem = {
  res_name: ResourceKey; // type of resource
  uri: string; // location of resource
  [propertyName: PropName]: any; // related properties for resource
};
export type TemplateUID = string; // must be unique within a schema

/// TEMPLATE TYPES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A template is a collection of properties defined in schema */
export type UR_Template = {
  _schema_id: UR_SchemaID;
  template_name: PropName;
  fields: {
    [templateProperty: PropName]: any;
  };
};
