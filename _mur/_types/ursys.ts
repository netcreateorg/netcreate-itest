/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CORE TYPES
  This is the base set of types that are used throughout the URSYS system, 
  including other type declarations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// DATA PARAMETER AND RETURN TYPES ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// we use various object conventions
export type DataObj = { [key: string]: any };
export type ErrObj = { error?: string; errorCode?: string; errorInfo?: string };
export type StatusObj = { status?: string; statusCode?: number; statusInfo?: string };
export type OpResult = DataObj & ErrObj & StatusObj;

/// BASE DATA TYPES ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** identifier strings for types of collections in the URSYS ecosystem */
export type PropName = string; // camelCase for user, _snake_case for internal

/// SNA EVENT CONVENTIONS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// SNA events use these conventions, which are based on ursys.d.ts DataObj
/// They are distinct from UI events and are used for notification purposes
/// rather than cascading events that can cancel each other.
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SNA_EvtName = string; // camelCase
export type SNA_EvtHandler = (evt: SNA_EvtName, param: DataObj) => void;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SNA_EvtOn = (evt: string, param: DataObj) => void;
export type SNA_EvtOff = (evt: string, param: DataObj) => void;
export type SNA_EvtOnce = (evt: string, param: DataObj) => void;

/// UNIVERSAL IDENTIFIERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Identify ownership and schema uniquely across the world */
type SchemaRoot = string; // e.g. 'ursys', 'rapt'
type SchemaName = string; // e.g. 'resource_type', 'meme', 'netcreate'
type SchemaVersion = `version=${string}`; // e.g. 'version=1.0.0'
type TagString = string; // e.g. 'tag1=foo;tag2' semicolon separated
export type UR_SchemaID = `${SchemaRoot}:${SchemaName}:${SchemaVersion};${TagString}`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Identify a dataset uniquely across the world */
type OrgDomain = string; // e.g. 'ursys.org', 'rapt
type BucketID = string; // e.g. a UUID with no / or : characters
type InstanceID = string; // e.g. a slashpath to a dataset resource
type AppID = string; // e.g. unique 'meme', 'step'
export type DS_DataURI =
  `${OrgDomain}:${BucketID}/${AppID}/${InstanceID}:${TagString}`;
