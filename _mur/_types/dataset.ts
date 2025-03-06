/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Types related to managing a collection of standardized items

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import type {
  DataObj,
  ErrObj,
  OpResult,
  SNA_EvtName,
  SNA_EvtHandler,
  DS_DataURI
} from './ursys.ts';

/// INTERFACES ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export interface IRecordSet {
  src_items: UR_Item[];
  cur_items: UR_Item[];
  cur_meta: ItemStatsResult;
  page_index: number;
  page_size: number;
  page_count: number;
  pages: UR_Item[][];

  getItems(): UR_Item[];
  getStats(name?: string): ItemStatsResult;
  getSrcItems(): UR_Item[];
  sort(sOpt?: SortOptions): IRecordSet;
  format(fOpt: ItemFormatOptions): IRecordSet;
  analyze(testOpts: ItemStatsOptions): IRecordSet;
  reset(): IRecordSet;
  paginate(pageSize?: number): IRecordSet;
  goPage(index: number): IRecordSet;
  nextPage(): IRecordSet;
  prevPage(): IRecordSet;
  getPage(): UR_Item[];
  getPageIndex(): number;
  getPageCount(): number;
  getPageSize(): number;
  isLastPage(): boolean;
  isFirstPage(): boolean;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** used by databin and dataset classes moving data across the network */
export interface IDS_Serialize {
  _getDataObj(): DS_DatasetObj;
  _setFromDataObj(data: DS_DatasetObj): OpResult;
  _serializeToJSON(): string;
  _deserializeFromJSON(json: string): void;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** required interface for dataAPI (implemented by DataBin abstract class) */
export interface IDS_DataBin {
  add(items: UR_Item[]): { added?: UR_Item[]; error?: string };
  read(ids?: UR_EntID[]): { items?: UR_Item[]; error?: string };
  update(items: UR_Item[]): { updated?: UR_Item[]; error?: string };
  replace(items: UR_Item[]): {
    replaced?: UR_Item[];
    skipped?: UR_Item[];
    error?: string;
  };
  write(items: UR_Item[]): {
    added?: UR_Item[];
    updated?: UR_Item[];
    error?: string;
  };
  deleteIDs(ids: UR_EntID[]): { deleted?: UR_Item[]; error?: string };
  delete(items: UR_Item[]): { deleted?: UR_Item[]; error?: string };
  clear(): void;
  get(ids?: UR_EntID[]): any[];
  on(event: SNA_EvtName, lis: SNA_EvtHandler): void;
  off(event: SNA_EvtName, lis: SNA_EvtHandler): void;
  notify(evt: SNA_EvtName, data: DataObj): void;
  find(criteria?: SearchOptions): UR_Item[];
  query(criteria?: SearchOptions): IRecordSet;
}

/// ASSET MANAGEMENT TYPES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a UR_Manifest is a description of the dataset contents that can be
 *  requested by name. The actual data is fetched from a ResourceURI */
export type ResourceURI = string; // a URI to a fetchable file/resource
export type DataBinURIs = { [binID: DataBinID]: ResourceURI };
export type DS_ContentMeta = {
  author?: string; // author name(s)
  source?: string; // source of the dataset
  organization?: string; // organization name
  create_time?: string; // date string
  modify_time?: string; // date string
  description?: string; // description of the dataset
};

/// MANIFEST OBJ DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type UR_ManifestObj = {
  _dataURI?: DS_DataURI;
  _meta?: DS_ContentMeta; // meta info on the manifest creator
  //  filenames of the databin files, relative to the dataURI
  itemlists?: DataBinURIs; // list of databin files
  itemdicts?: DataBinURIs; // list of databin files
  // StringLists, FileLists, etc
  // see DS_DatasetObj for the data storage
} & ErrObj;

/// DATASET OBJ DEFINITION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// data models have objects with an _id field that uniquely identifies
/// each entity in the dataset called a UID.
type IntString = `${string}`; // this is an integer padding string
export type UR_EntID = `${string}${IntString}`; // a unique identifier
export type UR_EntID_Obj = { _id: UR_EntID };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// an UR_Item is a union of MatchObj with UR_EntID
export type UR_NewItem = DataObj; // { [key: string]: any }
export type UR_Item = UR_EntID_Obj & DataObj; // { _id: UR_EntID; [key: string]: any }
/// an UR_Doc is an object with an _id field and a set of properties
export type UR_Doc = UR_EntID_Obj & DataObj; // doc is a single item
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// BinRefID identifies a unique "bin" of items of the same data type.
export type DataBinID = string; // snake_case
export type DataBinType = 'ItemDict' | 'ItemList';
export type UR_ItemList = UR_Item[];
export type UR_ItemDict = { [_id: UR_EntID]: UR_Doc };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// a DS_DatasetObj is the serialized form of a dataset returned from
/// a dataset source and used to initialize a Dataset class instance
export type DS_DatasetObj = {
  _dataURI?: DS_DataURI;
  // see github.com/dsriseah/ursys/discussions/25 fior list of types
  // see util-data-ops.ts for the equivalent foldernames
  ItemLists?: { [listname: DataBinID]: ItemListObj };
  ItemDicts?: { [dictname: DataBinID]: ItemDictObj };
} & ErrObj;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// serialized form of itemlist stored in DataBinURI file
type ItemListObj = {
  name: DataBinID;
  _prefix: string;
  _ord_digits: number;
  _ord_highest: number;
  items: UR_ItemList;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// serialized form of itemdict stored in DataBinURI file
type ItemDictObj = {
  name: DataBinID;
  _prefix: string;
  _ord_digits: number;
  _ord_highest: number;
  items: UR_ItemDict;
};

/// DATASET MANAGEMENT TYPES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type DatasetOp =
  | 'LOAD' // load a complete dataset into memory
  | 'UNLOAD' // unload a dataset from memory
  | 'PERSIST' // write the dataset back persistent storage
  | 'GET_MANIFEST' // get the manifest of the dataset
  | 'GET_DATA'; // get the entire dataset or BinID as JSON
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sent to dataset source by inquiring clients SYNC:SRV */
export type DatasetReq = {
  dataURI: string;
  authToken?: string;
  op: DatasetOp;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sent from dataset source to inquiring clients SYNC:CLI */
export type DatasetRes = {
  dataURI?: string;
  accToken?: string;
  // data
  data?: DS_DatasetObj;
  // meta
  status?: string;
  error?: string;
};

/// DATASET BIN SYNC TYPES ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** DataSyncOp is the operations that can be performed on a dataset via
 *  the SYNC:SRV_DATA protocol. See util-data-asset for lookup tables */
export type DataSyncOp =
  | 'CLEAR' // erase contents of databin
  | 'GET' // get contents/items of databin
  | 'ADD' // add new items to databin, new ids assigned
  | 'UPDATE' // update items in databin
  | 'WRITE' // update/add items in databin
  | 'DELETE' // delete items or ids from databin
  | 'REPLACE' // replace items in databin
  | 'FIND' // find items in databin
  | 'QUERY'; // query items in databin, returning recordset
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Mode of operation for a dataset source */
export type DataSyncMode =
  | 'local' // local only, no sync
  | 'local-ro' // local only, read-only
  | 'sync' // sync with remote
  | 'sync-ro'; // sync updates from remote, read-only
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** these flags are derived from value of DataSyncMode */
export type DataSyncFlags = {
  readOnly?: boolean;
  remote: IDS_DatasetAdapter;
  initOnly?: boolean;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type DataSyncOptions = {
  mode: DataSyncMode;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sent from a dataset source by inquiring clients SYNC:SRV */
export type DataSyncReq = {
  binID: DataBinID;
  op: DataSyncOp;
  accToken?: string;
  items?: UR_Item[];
  ids?: UR_EntID[];
  searchOpt?: SearchOptions;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** sent from a dataset source to a inquiring client SYNC:CLI */
export type DataSyncRes = {
  binID: DataBinID;
  binType: DataBinType;
  op: DataSyncOp;
  seqNum?: number;
  // meta
  status?: string;
  error?: string;
  skipped?: UR_EntID[];
  //
  items?: UR_Item[];
  added?: UR_Item[];
  updated?: UR_Item[];
  deleted?: UR_Item[];
  replaced?: UR_Item[];
};

/// DATASET ADAPTERS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement functions needed to write data to a remote datastore
 *  . syncData is the async method that writes data to remote datastore
 *  . handleError is the method that handles the return object from syncData */
export type IDS_DatasetAdapter = {
  accToken: string;
  selectDataset: (dataURI: string) => Promise<DatasetRes>;
  getDataObj: () => Promise<DS_DatasetObj>;
  syncData: (synReq: DataSyncReq) => Promise<DataSyncRes>;
  handleError: (params: any) => Promise<any>;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement functions needed to read/write data objects to a datastore */
export interface IDS_DataObjectAdapter {
  accToken: string;
  getManifest(dataURI: DS_DataURI): Promise<UR_ManifestObj>;
  readDatasetObj(dataURI: DS_DataURI): Promise<DS_DatasetObj>;
  readDataBinObj(dataURI: DS_DataURI, binID: DataBinID): Promise<DataObj>;
  writeDatasetObj(dataURI: DS_DataURI, dsObj: DS_DatasetObj): Promise<OpResult>;
  writeDataBinObj(
    dataURI: DS_DataURI,
    binID: DataBinID,
    dsObj: DS_DatasetObj
  ): Promise<OpResult>;
}

/// DATASET OP TYPES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type RangeType =
  | `gt ${string | number}`
  | `lt ${string | number}`
  | `gte ${string | number}`
  | `lte ${string | number}`
  | `eq ${string | number}`
  | `ne ${string | number}`
  | `between ${string | number} ${string | number}`;
export type MatchObj = { [key: string]: string | number };
export type RangeObj = { [key: string]: RangeType };
export type SortType = `none` | `sort_asc` | `sort_desc` | `random`;

/// ITEM SEARCH OPERATIONS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SearchOptions = {
  _lowercaseProps?: boolean; // false
  _forceNull?: boolean; // false
  _forceValue?: 'number' | 'string'; // true
  _cloneItems?: boolean; // true
  preFilter?: (items: UR_Item[]) => UR_Item[];
  missingFields?: string[];
  hasFields?: string[];
  matchCount?: number; // when set, limits the number of matches
  matchExact?: MatchObj;
  matchRange?: RangeObj;
  postFilter?: (items: UR_Item[]) => UR_Item[];
};
export type SearchFlags = {
  _flcp?: boolean; // force lowercase
  _fval?: 'number' | 'string' | undefined;
  _fnul?: boolean; // force null
  _clone?: boolean; // make clone
  b_miss?: string[]; // missing fields
  b_has?: string[]; // has fields
  count?: number;
  match_exact?: MatchObj;
  match_range?: RangeObj;
  f_pre?: (items: UR_Item[]) => UR_Item[];
  f_post?: (items: UR_Item[]) => UR_Item[];
};
export type SearchProps = { found?: string[]; missing?: string[]; extra?: string[] };
export type SearchState = {
  criteria: SearchOptions;
  flags: SearchFlags;
  props: SearchProps;
};

/// ITEM SORT OPS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type SortOptions = {
  _cloneItems?: boolean; //
  preFilter?: (items: UR_Item[]) => UR_Item[];
  sortBy?: { [field: string]: SortType };
  postFilter?: (items: UR_Item[]) => UR_Item[];
};

/// ITEM TRANSFORM OPS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type ItemTransformFunction = (item: UR_Item) => UR_Item;
export type ItemFormatOptions = {
  includeFields?: string[];
  excludeFields?: string[];
  transformBy?: { [field: string]: ItemTransformFunction };
};

/// ITEM TEST OPS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type ItemsMapFunction = (items: UR_Item[]) => any;
export type ItemStatsOptions = {
  groupBy?: { [test: string]: ItemsMapFunction };
  statTests?: { [stat: string]: ItemsMapFunction };
};
export type ItemStatsResult = {
  groups?: { [test: string]: UR_Item[] };
  [stat: string]: any;
};

/// FORWARDED EXPORTS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export type { DataObj, ErrObj, OpResult, UR_SchemaID } from './ursys.js';
export type { DataBin } from '../common/abstract-data-databin.ts';
export type { Dataset } from '../common/class-data-dataset.ts';
export type { RecordSet } from '../common/class-data-recordset.ts';
export type { DS_DataURI } from './ursys.ts';
