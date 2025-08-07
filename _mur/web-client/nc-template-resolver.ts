/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NetCreate Template Property Resolver
  
  Metadata-first property resolution system that replaces the brittle case-based
  logic in GetDataForProp. Uses _control semantic types to determine how to
  resolve propDef paths to template data and UI metadata.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE DECLARATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type TemplateObj = {
  _ui?: Record<string, any>;
  _ui_defs?: Record<string, any>;
  [key: string]: any;
};

type ResolverResult = {
  groupName?: string;
  propName?: string;
  propField?: string;
  sourceMeta?: any;
  sourceData?: any;
  error?: string;
};

type ControlResolver = (
  template: TemplateObj,
  pathSegments: string[],
  metadata: any
) => ResolverResult;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);

/// PROPDEF ENCODING/DECODING /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Decode propDef string into path segments with array index handling */
function DecodePropDef(propDef: string): [string?, string?, string?, number?] {
  console.log('DecodePropDef: Parse propDef into segments and extract array indices');
  console.log('  - Handle bracket notation: commentTypes[0].prompts[1]');
  console.log('  - Return [groupName, propName, propField, index]');

  // TODO: Implement actual parsing logic
  return [undefined, undefined, undefined, undefined];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Encode path segments into propDef string */
function EncodePropDef(
  groupName?: string,
  propName?: string,
  propField?: string,
  index?: number
): string {
  console.log('EncodePropDef: Build propDef string from path segments');
  console.log('  - Handle array index insertion: commentTypes[0].prompts');
  console.log('  - Return dotted path string');

  // TODO: Implement actual encoding logic
  return '';
}

/// METADATA RESOLUTION ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: Walk metadata tree to find control metadata for path */
function u_ResolveMetadata(template: TemplateObj, pathSegments: string[]): any {
  console.log('u_ResolveMetadata: Walk _ui tree to find control metadata');
  console.log('  - Navigate path:', pathSegments);
  console.log('  - Find _control semantic type');
  console.log('  - Return metadata object or null');

  // TODO: Implement metadata tree traversal
  return null;
}

/// CONTROL-SPECIFIC RESOLVERS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** RESOLVER: Handle in_string control type */
function r_ResolveString(
  template: TemplateObj,
  pathSegments: string[],
  metadata: any
): ResolverResult {
  console.log('r_ResolveString: Simple property access');
  console.log('  - Direct template property lookup');
  console.log('  - Return single value');

  return { error: 'Not implemented' };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** RESOLVER: Handle composite control type */
function r_ResolveComposite(
  template: TemplateObj,
  pathSegments: string[],
  metadata: any
): ResolverResult {
  console.log('r_ResolveComposite: Nested object structure');
  console.log('  - Return metadata for child properties');
  console.log('  - Handle multi-level nesting');

  return { error: 'Not implemented' };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** RESOLVER: Handle in_array control type */
function r_ResolveArray(
  template: TemplateObj,
  pathSegments: string[],
  metadata: any
): ResolverResult {
  console.log('r_ResolveArray: Array property handling');
  console.log('  - Handle nested arrays: commentTypes.prompts');
  console.log('  - Return parent array data with nested metadata');
  console.log('  - Support indexed access: commentTypes[0]');

  return { error: 'Not implemented' };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** RESOLVER: Handle in_colorgroup control type */
function r_ResolveColorGroup(
  template: TemplateObj,
  pathSegments: string[],
  metadata: any
): ResolverResult {
  console.log('r_ResolveColorGroup: Specialized array for color data');
  console.log('  - Terminal array access');
  console.log('  - Return array data directly');

  return { error: 'Not implemented' };
}

/// MAIN RESOLVER /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Resolver dispatch table mapping _control types to resolver functions */
const CONTROL_RESOLVERS: Record<string, ControlResolver> = {
  'in_string': r_ResolveString,
  'in_text': r_ResolveString,
  'in_boolean': r_ResolveString,
  'in_composite': r_ResolveComposite,
  'in_array': r_ResolveArray,
  'in_colorgroup': r_ResolveColorGroup
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Main property resolver - metadata-first approach */
function GetDataForProp(template: TemplateObj, propDef: string): ResolverResult {
  console.log('GetDataForProp: Metadata-first property resolution');
  console.log('  1. Parse propDef into path segments');
  console.log('  2. Walk metadata tree to find _control type');
  console.log('  3. Dispatch to control-specific resolver');
  console.log('  4. Return {sourceMeta, sourceData} or {error}');

  const pathSegments = propDef.split('.');
  console.log('  - Path segments:', pathSegments);

  const metadata = u_ResolveMetadata(template, pathSegments);
  if (!metadata) {
    return { error: `No metadata found for ${propDef}` };
  }

  const controlType = metadata._control;
  console.log('  - Control type:', controlType);

  const resolver = CONTROL_RESOLVERS[controlType];
  if (!resolver) {
    return { error: `Unsupported control type: ${controlType}` };
  }

  console.log('  - Dispatching to resolver for', controlType);
  return resolver(template, pathSegments, metadata);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { DecodePropDef, EncodePropDef, GetDataForProp };
