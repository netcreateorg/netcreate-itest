/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATABASE SERVER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/* eslint-disable newline-per-chained-call */
/* eslint-disable nonblock-statement-body-position */

/* added for pull request #81 so 'npm run lint' test appears clean */
/* eslint-disable no-unused-vars */

const DBG = false;
const USE_VALIDATOR = true;

/// LOAD LIBRARIES ////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const Loki = require('lokijs');
const PATH = require('path');
const FSE = require('fs-extra');
const TOML = require('@iarna/toml');
const TemplateUtil = require('./server-template-util');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
const SESSION = require('./common-session');
const LOGGER = require('./server-logger');
const PROMPTS = require('../system/util/prompts');
const FILTER = require('../view/netcreate/components/filter/FilterEnums');
const { EDITORTYPE } = require('../system/util/enum');

const PR = PROMPTS.Pad('ServerDB');
const RUNTIMEPATH = './runtime/';
const TEMPLATEPATH = './app-templates/';
const TEMPLATE_EXT = '.template.toml';
const BACKUPPATH = 'backups/'; // combined with RUNTIMEPATH, so no leading './'
const NC_CONFIG = require('../../app-config/netcreate-config');

/// MODULE-WIDE VARS //////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let db_file;
let m_options; // saved initialization options
let m_db; // loki database
let m_max_edgeID;
let m_max_nodeID;
let m_max_commentID;
let m_dupe_set; // set of nodeIDs for determine whether there are duplicates
let NODES; // loki "nodes" collection
let EDGES; // loki "edges" collection
let COMMENTS; // loki "comments" collection
let READBY; // loki "readby" collection
let TEMPLATE;
let m_locked_nodes; // map key = nodeID, value = uaddr initiating the lock
let m_locked_edges; // map key = edgeID, value = uaddr initiating the lock
let m_locked_comments; // map key = commentID, value = uaddr initiating the lock
let m_template_locks; // set of uaddr that have locks on template setting editing
let m_open_editors = []; // array of template, node, or edge editors
/// formatting
const BL = s => `\x1b[1;34m${s}\x1b[0m`;
const RD = s => `\x1b[1;31m${s}\x1b[0m`;
const YL = s => `\x1b[1;33m${s}\x1b[0m`;

/// API METHODS ///////////////////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
let DB = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Backup Database File Utility
    Used by PKT_MergeDatabase to clone the db before importing.
    Saves the db in the runtime folder with a timestamp suffix. */
function m_BackupDatabase() {
  FSE.ensureDirSync(PATH.dirname(db_file));
  if (FSE.existsSync(db_file)) {
    const timestamp = new Date().toISOString().replace(/:/g, '.');
    const backupDBFilePath = m_GetValidDBFilePath(
      BACKUPPATH + NC_CONFIG.dataset + '_' + timestamp
    );
    console.log(PR, 'Saving database backup to', backupDBFilePath);
    FSE.copySync(db_file, backupDBFilePath);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Default Template Path */
function m_DefaultTemplatePath() {
  return TEMPLATEPATH + '_default' + TEMPLATE_EXT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Initialize the database */
DB.InitializeDataset = function (options = {}) {
  let dataset = NC_CONFIG.dataset;
  db_file = m_GetValidDBFilePath(dataset);
  FSE.ensureDirSync(PATH.dirname(db_file));
  if (!FSE.existsSync(db_file)) {
    console.log(
      PR,
      YL(`NOTICE: NO EXISTING DATABASE ${db_file}, so creating BLANK DATABASE...`)
    );
  }
  // console.log(PR, YL(`loading dataset`), `${BL(db_file)}...`);
  let ropt = {
    autoload: true,
    autoloadCallback: async_DatabaseInitialize,
    autosave: true,
    autosaveCallback: f_AutosaveStatus,
    autosaveInterval: 4000 // save every four seconds
  };
  ropt = Object.assign(ropt, options);
  m_db = new Loki(db_file, ropt);
  m_options = ropt;
  m_options.db_file = db_file; // store for use by DB.WriteJSON

  /*/ !!! HACK NOTED !!!
      CALLBACK ON LOKI LOAD
      also has side-effect of initializing template, which has
      nothing to do with the database :|
  /*/

  async function async_DatabaseInitialize() {
    // on the first load of (non-existent database), we will have no
    // collections so we can detect the absence of our collections and
    // add (and configure) them now.
    NODES = m_db.getCollection('nodes');
    if (NODES === null) NODES = m_db.addCollection('nodes');
    m_locked_nodes = new Map();
    EDGES = m_db.getCollection('edges');
    if (EDGES === null) EDGES = m_db.addCollection('edges');
    m_locked_edges = new Map();
    COMMENTS = m_db.getCollection('comments');
    if (COMMENTS === null) COMMENTS = m_db.addCollection('comments');
    READBY = m_db.getCollection('readby');
    if (READBY === null) READBY = m_db.addCollection('readby');
    m_locked_comments = new Map();

    // initialize unique set manager
    m_dupe_set = new Set();
    let dupeNodes = [];

    // find highest NODE ID
    if (NODES.count() > 0) {
      m_max_nodeID = NODES.mapReduce(
        obj => {
          // side-effect: make sure ids are numbers
          m_CleanObjID('node.id', obj);
          // side-effect: check for duplicate ids
          if (m_dupe_set.has(obj.id)) {
            dupeNodes.push(obj);
          } else {
            m_dupe_set.add(obj.id);
          }
          // return value
          return obj.id;
        },
        arr => {
          return Math.max(...arr);
        }
      );
    } else {
      m_max_nodeID = 0;
    }
    // remap duplicate NODE IDs
    dupeNodes.forEach(obj => {
      m_max_nodeID += 1;
      LOGGER.WriteRLog(
        {},
        PR,
        `# rewriting duplicate nodeID ${obj.id} to ${m_max_nodeID}`
      );
      obj.id = m_max_nodeID;
    });

    // find highest EDGE ID
    if (EDGES.count() > 0) {
      m_max_edgeID = EDGES.mapReduce(
        obj => {
          m_CleanObjID('edge.id', obj);
          m_CleanEdgeEndpoints(obj.id, obj);
          return obj.id;
        },
        arr => {
          return Math.max(...arr);
        }
      ); // end mapReduce edge ids
    } else {
      m_max_edgeID = 0;
    }
    console.log(
      PR,
      'graph data loaded',
      BL(db_file),
      `m_max_nodeID '${m_max_nodeID}', m_max_edgeID '${m_max_edgeID}'`
    );

    // find highest COMMENT ID
    if (COMMENTS.count() > 0) {
      m_max_commentID = COMMENTS.mapReduce(
        obj => {
          // side-effect: make sure ids are numbers
          m_CleanObjID('comment.id', obj);
          return obj.comment_id;
        },
        arr => {
          return Math.max(...arr);
        }
      );
    } else {
      m_max_commentID = 0;
    }

    m_db.saveDatabase();

    // load non-database assets from dataset.toml, creating
    // it if necessary
    await m_LoadTemplate();
  } // end async_DatabaseInitialize

  // UTILITY FUNCTION
  function f_AutosaveStatus() {
    let nodeCount = NODES.count();
    let edgeCount = EDGES.count();
    let commentCount = COMMENTS.count();
    let readbyCount = READBY.count();
    console.log(
      PR,
      `AUTOSAVING! ${nodeCount} NODES / ${edgeCount} EDGES / ${commentCount} COMMENTS / ${readbyCount} READBY <3`
    );
  }
}; // InitializeDataset()

/// TEMPLATE LOADER ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Load Template */
async function m_LoadTemplate() {
  // make sure default template exists and is valid
  const defaultTemplatePath = m_DefaultTemplatePath();
  if (!FSE.existsSync(defaultTemplatePath)) {
    console.error(PR, `Default template not found at ${defaultTemplatePath}`);
    process.exit(1);
  }
  // validate the default template, as this is our single source of truth
  const [defaultOk, defaultReport] =
    TemplateUtil.GetTOMLValidation(defaultTemplatePath);
  if (!defaultOk) {
    console.error(PR, RD(`Invalid default template`), `'${defaultTemplatePath}'`);
    console.error(
      PR,
      YL(`Correct using ${YL(`./nc-validate.js -vv`)}, then restart server.\n`)
    );
    console.error(defaultReport);
    process.exit(1);
  } else {
    console.log(PR, BL('Default template validated'), `'${defaultTemplatePath}'`);
  }
  const TOMLPath = m_GetTemplateTOMLFilePath();
  FSE.ensureDirSync(PATH.dirname(TOMLPath));
  if (!FSE.existsSync(TOMLPath)) {
    console.log(PR, `Cloning default template to ${TOMLPath}`);
    FSE.copySync(m_DefaultTemplatePath(), TOMLPath);
  }
  const data = FSE.readFileSync(TOMLPath, 'utf8');
  const json = TOML.parse(data);
  TEMPLATE = json;

  if (USE_VALIDATOR) {
    // validate the loaded template
    const [templateOK, report] = TemplateUtil.GetValidation(TEMPLATE);
    if (!templateOK) {
      const shortPath = PATH.basename(TOMLPath).split('.')[0];
      console.error(PR, RD(`Invalid dataset template`), `'${TOMLPath}'`);
      console.error(
        PR,
        `Correct using ${YL(
          `./nc-validate.js ${shortPath} -vv`
        )} script, then restart server.`
      );
      console.error(PR, `Report follows:\n`);
      console.error(report);
      process.exit(1);
    } else {
      console.log(PR, BL('Dataset template validated'), `'${TOMLPath}'`);
    }
  }

  // don't clear the locks of a reload of template happens post-init
  if (m_template_locks === undefined) m_template_locks = new Set();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// removed deprecated deprecated_MigrateTemplate()
/// removed deprecated deprecated_ValidateTemplate()
/// replaced by server-template-util.js and server-template-schema.js
/// last commit before removal: 7a9f280d
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: load database
 *  note: InitializeDataset() was already called on system initialization
 *  to populate the NODES and EDGES structures */
DB.PKT_GetDataset = function (pkt) {
  let nodes = NODES.chain().data({ removeMeta: false });
  let edges = EDGES.chain().data({ removeMeta: false });
  let comments = COMMENTS.chain().data();
  let readby = READBY.chain().data();
  if (DBG)
    console.log(
      PR,
      `PKT_GetDataset ${pkt.Info()} (loaded ${nodes.length} nodes, ${
        edges.length
      } edges)`
    );
  m_MigrateNodes(nodes);
  m_MigrateEdges(edges);
  LOGGER.WriteRLog(pkt.InfoObj(), `getdatabase`);
  return { d3data: { nodes, edges }, template: TEMPLATE, comments, readby };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: reset database from scratch */
DB.PKT_SetDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_SetDatabase`);
  let { nodes = [], edges = [], comments = [], readby = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `setting ${edges.length} edges...`);
  if (!comments.length) console.log(PR, 'WARNING: empty comments array');
  else console.log(PR, `setting ${comments.length} comments...`);
  if (!readby.length) console.log(PR, 'WARNING: empty readby array');
  else console.log(PR, `setting ${readby.length} readby...`);
  NODES.clear();
  NODES.insert(nodes);
  EDGES.clear();
  EDGES.insert(edges);
  COMMENTS.clear();
  COMMENTS.insert(comments);
  READBY.clear();
  READBY.insert(readby);
  console.log(PR, `PKT_SetDatabase complete. Data available on next get.`);
  m_db.close();
  DB.InitializeDataset();
  LOGGER.WriteRLog(pkt.InfoObj(), `setdatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Add nodes/edges to an existing db */
DB.PKT_InsertDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_InsertDatabase`);
  let { nodes = [], edges = [], comments = [], readby = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `setting ${edges.length} edges...`);
  if (!comments.length) console.log(PR, 'WARNING: empty comments array');
  else console.log(PR, `setting ${comments.length} comments...`);
  if (!readby.length) console.log(PR, 'WARNING: empty readby array');
  else console.log(PR, `setting ${readby.length} readby...`);
  NODES.insert(nodes);
  EDGES.insert(edges);
  COMMENTS.insert(comments);
  READBY.insert(readby);
  console.log(PR, `PKT_InsertDatabase complete. Data available on next get.`);
  m_db.close();
  DB.InitializeDataset();
  LOGGER.WriteRLog(pkt.InfoObj(), `setdatabase`);
  return { OK: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Update or add nodes/edges to an existing db
 *  If the node/edge exists, update it.
 *  Otherwise, insert it.
 *  This walks down the node and edge arrays one by one,
 *  using PKT_Update to decide whether to insert or update the data.
 *  REVIEW: Consider batch operations ala `NODES.insert(nodes)`?
 */
DB.PKT_MergeDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_MergeDatabase`);
  let { nodes = [], edges = [], comments = [], readby = [] } = pkt.Data();

  // Save Backup First!
  m_BackupDatabase();

  // insert nodes one by one
  nodes.forEach(n => {
    pkt.data.node = n;
    DB.PKT_Update(pkt);
  });
  pkt.data.node = undefined; // clear, no longer needed

  edges.forEach(e => {
    pkt.data.edge = e;
    DB.PKT_Update(pkt);
  });
  pkt.data.edge = undefined; // clear, no longer needed

  comments.forEach(c => {
    pkt.data.comments = c;
    DB.PKT_Update(pkt);
  });
  pkt.data.comment = undefined; // clear, no longer needed

  readby.forEach(r => {
    pkt.data.readby = r;
    DB.PKT_Update(pkt);
  });
  pkt.data.readby = undefined; // clear, no longer needed

  return new Promise((resolve, reject) =>
    m_db.saveDatabase(err => {
      if (err) reject(new Error('rejected'));
      DB.InitializeDataset();
      LOGGER.WriteRLog(pkt.InfoObj(), `mergedatabase`);
      resolve({ OK: true });
    })
  );
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Update all data in existing database.
 *  Used to update node/edge types after template edit */
DB.PKT_UpdateDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_UpdateDatabase`);
  let { nodes = [], edges = [], comments = [], readby = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `updating ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `updating ${edges.length} edges...`);
  if (!comments.length) console.log(PR, 'WARNING: empty comments array');
  else console.log(PR, `updating ${comments.length} comments...`);
  if (!readby.length) console.log(PR, 'WARNING: empty readby array');
  else console.log(PR, `updating ${readby.length} readby...`);
  NODES.update(nodes);
  EDGES.update(edges);
  COMMENTS.update(comments);
  READBY.update(readby);
  console.log(PR, `PKT_UpdateDatabase complete. Disk db file updated.`);
  m_db.saveDatabase();
  LOGGER.WriteRLog(pkt.InfoObj(), `updatedatabase`);
  return { OK: true };
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: reset database from scratch
 *  Used to clear the existing database and load new nodes and edges
 *  The equivalent of loading a project -- used to faciliate loading
 *  a project with Turbo360.
 */
DB.PKT_ReplaceDatabase = function (pkt) {
  if (DBG) console.log(PR, `PKT_ReplaceDatabase`);
  let { nodes = [], edges = [], comments = [], readby = [] } = pkt.Data();
  if (!nodes.length) console.log(PR, 'WARNING: empty nodes array');
  else console.log(PR, `setting ${nodes.length} nodes...`);
  if (!edges.length) console.log(PR, 'WARNING: empty edges array');
  else console.log(PR, `setting ${edges.length} edges...`);
  if (!comments.length) console.log(PR, 'WARNING: empty comments array');
  else console.log(PR, `setting ${comments.length} comments...`);
  if (!readby.length) console.log(PR, 'WARNING: empty readby array');
  else console.log(PR, `setting ${readby.length} readby...`);

  // Save Backup First!
  m_BackupDatabase();

  NODES.clear();
  NODES.insert(nodes);
  EDGES.clear();
  EDGES.insert(edges);
  COMMENTS.clear();
  COMMENTS.insert(comments);
  READBY.clear();
  READBY.insert(readby);
  m_db.saveDatabase();
  LOGGER.WriteRLog(pkt.InfoObj(), `replacedatabase`);
  return { OK: true };
};

/// ID HELPER FUNCTIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// WARN: Side Effect: Changes `m_max_nodeID`
function m_CalculateMaxNodeID() {
  if (NODES.count() > 0) {
    m_max_nodeID = NODES.mapReduce(
      obj => obj.id,
      arr => Math.max(...arr)
    );
  } else {
    m_max_nodeID = 0;
  }
  return m_max_nodeID;
}
DB.PKT_CalculateMaxNodeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_CalculateMaxNodeID ${pkt.Info()}`);
  return { maxNodeID: m_CalculateMaxNodeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetNewNodeID() {
  m_max_nodeID += 1;
  return m_max_nodeID;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_GetNewNodeID ${pkt.Info()} nodeID ${m_max_nodeID}`);
  return { nodeID: m_GetNewNodeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewNodeIDs = function (pkt) {
  const count = Number(pkt.Data().count);
  const firstId = m_max_nodeID + 1;
  const nodeIDs = [];
  for (let i = 0; i < count; i++) nodeIDs.push(firstId + i);
  m_max_nodeID += count;
  if (DBG) console.log(PR, `PKT_GetNewNodeIDS ${pkt.Info()} nodeIDs ${nodeIDs}`);
  return { nodeIDs };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CalculateMaxEdgeID() {
  if (EDGES.count() > 0) {
    m_max_edgeID = EDGES.mapReduce(
      obj => obj.id,
      arr => Math.max(...arr)
    );
  } else {
    m_max_edgeID = 0;
  }
  return m_max_edgeID;
}
DB.PKT_CalculateMaxEdgeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_CalculateMaxEdgeID ${pkt.Info()}`);
  return { maxEdgeID: m_CalculateMaxEdgeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetNewEdgeID() {
  m_max_edgeID += 1;
  return m_max_edgeID;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeID = function (pkt) {
  if (DBG) console.log(PR, `PKT_GetNewEdgeID ${pkt.Info()} edgeID ${m_max_edgeID}`);
  return { edgeID: m_GetNewEdgeID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_GetNewEdgeIDs = function (pkt) {
  const count = Number(pkt.Data().count);
  const firstId = m_max_edgeID + 1;
  const edgeIDs = [];
  for (let i = 0; i < count; i++) edgeIDs.push(firstId + i);
  m_max_edgeID += count;
  if (DBG) console.log(PR, `PKT_GetNewEdgeIDs ${pkt.Info()} edgeIDs ${edgeIDs}`);
  return { edgeIDs };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetNewCommentID() {
  m_max_commentID += 1;
  return m_max_commentID;
}
DB.PKT_GetNewCommentID = function (pkt) {
  if (DBG)
    console.log(PR, `PKT_GetNewCommentID ${pkt.Info()} commentID ${m_max_commentID}`);
  return { comment_id: m_GetNewCommentID() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// WARN: Side Effect: Changes `m_max_nodeID`
function m_CalculateMaxCommentID() {
  if (COMMENTS.count() > 0) {
    m_max_commentID = COMMENTS.mapReduce(
      obj => obj.comment_id,
      arr => Math.max(...arr)
    );
  } else {
    m_max_commentID = 0;
  }
  return m_max_commentID;
}

/// NODE LOCKING METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockNode = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check if node is already locked
  if (m_locked_nodes.has(nodeID))
    return m_MakeLockError(`nodeID ${nodeID} is already locked`);
  // SUCCESS
  // single matching node exists and is not yet locked, so lock it
  m_locked_nodes.set(uaddr);
  return { nodeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockNode = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  // check that node is already locked
  if (m_locked_nodes.has(nodeID)) {
    m_locked_nodes.delete(nodeID);
    return { nodeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`nodeID ${nodeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_IsNodeLocked = function (pkt) {
  let { nodeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidNode(nodeID);
  if (errcode) return errcode;
  const isLocked = m_locked_nodes.has(nodeID);
  return { nodeID, locked: isLocked };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidNode(nodeID) {
  if (!nodeID) return m_MakeLockError(`undefined nodeID`);
  nodeID = Number.parseInt(nodeID, 10);
  if (isNaN(nodeID)) return m_MakeLockError(`nodeID was not a number`);
  if (nodeID < 0) return m_MakeLockError(`nodeID ${nodeID} must be positive integer`);
  if (nodeID > m_max_nodeID)
    return m_MakeLockError(`nodeID ${nodeID} is out of range`);
  // find if the node exists
  let matches = NODES.find({ id: nodeID });
  if (matches.length === 0) return m_MakeLockError(`nodeID ${nodeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(
      `nodeID ${nodeID} matches multiple entries...critical error!`
    );
  // no retval is no error!
  return undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MakeLockError(info) {
  return { NOP: `ERR`, INFO: info };
}

/// EDGE LOCKING METHODS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockEdge = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check if edge is already locked
  if (m_locked_edges.has(edgeID))
    return m_MakeLockError(`edgeID ${edgeID} is already locked`);
  // SUCCESS
  // single matching edge exists and is not yet locked, so lock it
  m_locked_edges.set(edgeID, uaddr);
  return { edgeID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockEdge = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  // check that edge is already locked
  if (m_locked_edges.has(edgeID)) {
    m_locked_edges.delete(edgeID);
    return { edgeID, unlocked: true };
  }
  // this is an error because nodeID wasn't in the lock table
  return m_MakeLockError(`edgeID ${edgeID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_IsEdgeLocked = function (pkt) {
  let { edgeID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  let errcode = m_IsInvalidEdge(edgeID);
  if (errcode) return errcode;
  const isLocked = m_locked_edges.has(edgeID);
  return { edgeID, locked: isLocked };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_IsInvalidEdge(edgeID) {
  if (!edgeID) return m_MakeLockError(`undefined edgeID`);
  edgeID = Number.parseInt(edgeID, 10);
  if (isNaN(edgeID)) return m_MakeLockError(`edgeID was not a number`);
  if (edgeID < 0) return m_MakeLockError(`edgeID ${edgeID} must be positive integer`);
  if (edgeID > m_max_edgeID)
    return m_MakeLockError(`edgeID ${edgeID} is out of range`);
  // find if the node exists
  let matches = EDGES.find({ id: edgeID });
  if (matches.length === 0) return m_MakeLockError(`edgeID ${edgeID} not found`);
  if (matches.length > 1)
    return m_MakeLockError(
      `edgeID ${edgeID} matches multiple entries...critical error!`
    );
  // no retval is no error!
  return undefined;
}

/// COMMENT LOCKING ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestLockComment = function (pkt) {
  let { commentID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  // check if comment is already locked
  if (m_locked_comments.has(commentID))
    return m_MakeLockError(`commentID ${commentID} is already locked`);
  // SUCCESS
  // single matching comment exists and is not yet locked, so lock it
  m_locked_comments.set(commentID, uaddr);
  return { commentID, locked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockComment = function (pkt) {
  let { commentID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  // check that comment is already locked
  if (m_locked_comments.has(commentID)) {
    m_locked_comments.delete(commentID);
    return { commentID, unlocked: true };
  }
  // this is an error because commentID wasn't in the lock table
  return m_MakeLockError(`commentID ${commentID} was not locked so can't unlock`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_IsCommentLocked = function (pkt) {
  let { commentID } = pkt.Data();
  const uaddr = pkt.s_uaddr;
  const isLocked = m_locked_comments.has(commentID);
  return { commentID, locked: isLocked };
};

/// UNLOCK ALL METHODS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllNodes = function (pkt) {
  m_locked_nodes = new Map();
  return { unlocked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllEdges = function (pkt) {
  m_locked_edges = new Map();
  return { unlocked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAllComments = function (pkt) {
  m_locked_comments = new Map();
  return { unlocked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.PKT_RequestUnlockAll = function (pkt) {
  m_locked_nodes = new Map();
  m_locked_edges = new Map();
  m_locked_comments = new Map();
  m_open_editors = [];
  return { unlocked: true };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by server-network when a client disconnects we want to unlock any
 *  nodes and edges they had locked. */
DB.UnlockByUADDR = function (uaddr) {
  m_locked_nodes.forEach((value, key) => {
    if (value === uaddr) {
      m_locked_nodes.delete(key);
    }
  });
  m_locked_edges.forEach((value, key) => {
    if (value === uaddr) m_locked_edges.delete(key);
  });
  m_locked_comments.forEach((value, key) => {
    if (value === uaddr) m_locked_comments.delete(key);
  });
  if (m_template_locks.has(uaddr)) {
    console.log(PR, `template lock ${uaddr}' released`);
    m_template_locks.delete(uaddr);
  }
};

/// NODE, EDGE, COMMENT UPDATE METHODS ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// eslint-disable-next-line complexity
DB.PKT_Update = function (pkt) {
  let { node, edge, nodeID, replacementNodeID, edgeID, comment, readbys } =
    pkt.Data();
  let retval = {};
  // PROCESS NODE INSERT/UPDATE
  if (node) {
    m_CleanObjID(`${pkt.Info()} node.id`, node);
    let matches = NODES.find({ id: node.id });
    if (matches.length === 0) {
      // if there was no node, then this is an insert new operation
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} INSERT nodeID ${JSON.stringify(node)}`
        );

      // Handle different id types
      if (isNaN(node.id)) {
        // If the node id has NOT been defined, generate a new node id
        node.id = m_GetNewNodeID();
      }

      LOGGER.WriteRLog(pkt.InfoObj(), `insert node`, node.id, JSON.stringify(node));
      DB.AppendNodeLog(node, pkt); // log GroupId to node stored in database
      NODES.insert(node);
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'insert', node: updatedNode };
    } else if (matches.length === 1) {
      // there was one match to update
      NODES.findAndUpdate({ id: node.id }, n => {
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} UPDATE nodeID ${node.id} ${JSON.stringify(
              node
            )}`
          );
        LOGGER.WriteRLog(pkt.InfoObj(), `update node`, node.id, JSON.stringify(node));
        DB.AppendNodeLog(n, pkt); // log GroupId to node stored in database
        Object.assign(n, node);
      });
      // Return the updated record -- needed to update metadata
      let updatedNode = NODES.findOne({ id: node.id });
      if (!updatedNode)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find node after update!  This should not happen! ${
            node.id
          } ${JSON.stringify(node)}`
        );
      retval = { op: 'update', node: updatedNode };
    } else {
      if (DBG)
        console.log(PR, `WARNING: multiple nodeID ${node.id} x${matches.length}`);
      LOGGER.WriteRLog(pkt.InfoObj(), `ERROR`, node.id, 'duplicate node id');
      retval = { op: 'error-multinodeid' };
    }
    // Always update m_max_nodeID
    m_CalculateMaxNodeID();
    return retval;
  } // if node

  // PROCESS EDGE INSERT/UPDATE
  if (edge) {
    m_CleanObjID(`${pkt.Info()} edge.id`, edge);
    let matches = EDGES.find({ id: edge.id });
    if (matches.length === 0) {
      // this is a new edge
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} INSERT edgeID ${edge.id} ${JSON.stringify(edge)}`
        );

      // Handle different id types
      if (isNaN(edge.id)) {
        // If the edge id has NOT been defined, generate a new edge id
        edge.id = m_GetNewEdgeID();
      }

      LOGGER.WriteRLog(pkt.InfoObj(), `insert edge`, edge.id, JSON.stringify(edge));
      DB.AppendEdgeLog(edge, pkt); // log GroupId to edge stored in database
      EDGES.insert(edge);
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find edge after update!  This should not happen! ${
            edge.id
          } ${JSON.stringify(edge)}`
        );
      retval = { op: 'insert', edge: updatedEdge };
    } else if (matches.length === 1) {
      // update this edge
      EDGES.findAndUpdate({ id: edge.id }, e => {
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.SourceGroupID()} UPDATE edgeID ${
              edge.id
            } ${JSON.stringify(edge)}`
          );
        LOGGER.WriteRLog(pkt.InfoObj(), `update edge`, edge.id, JSON.stringify(edge));
        DB.AppendEdgeLog(e, pkt); // log GroupId to edge stored in database
        Object.assign(e, edge);
      });
      // Return the updated record -- needed to update metadata
      let updatedEdge = EDGES.findOne({ id: edge.id });
      if (!updatedEdge)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find edge after update!  This should not happen! ${
            edge.id
          } ${JSON.stringify(edge)}`
        );
      retval = { op: 'update', edge: updatedEdge };
    } else {
      console.log(PR, `WARNING: multiple edgeID ${edge.id} x${matches.length}`);
      LOGGER.WriteRLog(pkt.InfoObj(), `ERROR`, node.id, 'duplicate edge id');
      retval = { op: 'error-multiedgeid' };
    }
    // Always update m_max_edgeID
    m_CalculateMaxEdgeID();
    return retval;
  } // if edge

  // DELETE NODE
  if (nodeID !== undefined) {
    nodeID = m_CleanID(`${pkt.Info()} nodeID`, nodeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE nodeID ${nodeID}`);
    // Log first so it's apparent what is triggering the edge changes
    LOGGER.WriteRLog(pkt.InfoObj(), `delete node`, nodeID);

    // handle edges
    let edgesToProcess = EDGES.where(e => {
      return e.source === nodeID || e.target === nodeID;
    });

    // handle linked nodes
    replacementNodeID = m_CleanID(
      `${pkt.Info()} replacementNodeID`,
      replacementNodeID
    );
    if (replacementNodeID !== -1) {
      // re-link edges to replacementNodeID...
      EDGES.findAndUpdate({ source: nodeID }, e => {
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `relinking edge`,
          e.id,
          `to`,
          replacementNodeID
        );
        e.source = replacementNodeID;
      });
      EDGES.findAndUpdate({ target: nodeID }, e => {
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `relinking edge`,
          e.id,
          `to`,
          replacementNodeID
        );
        e.target = replacementNodeID;
      });
    } else {
      // ... or delete edges completely
      let sourceEdges = EDGES.find({ source: nodeID });
      EDGES.findAndRemove({ source: nodeID });
      if (sourceEdges.length)
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `deleting ${sourceEdges.length} sources matching ${nodeID}`
        );
      let targetEdges = EDGES.find({ target: nodeID });
      EDGES.findAndRemove({ target: nodeID });
      if (targetEdges.length)
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `deleting ${targetEdges.length} targets matching ${nodeID}`
        );
    }
    // ...finally remove the node itself
    NODES.findAndRemove({ id: nodeID });
    return { op: 'delete', nodeID, replacementNodeID };
  }

  // DELETE EDGES
  if (edgeID !== undefined) {
    edgeID = m_CleanID(`${pkt.Info()} edgeID`, edgeID);
    if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE edgeID ${edgeID}`);
    LOGGER.WriteRLog(pkt.InfoObj(), `delete edge`, edgeID);
    EDGES.findAndRemove({ id: edgeID });
    return { op: 'delete', edgeID };
  }

  // PROCESS COMMENT INSERT/UPDATE
  if (comment) {
    m_CleanObjID(`${pkt.Info()} comment.id`, comment);
    let matches = COMMENTS.find({ comment_id: comment.comment_id });
    if (matches.length === 0) {
      // if there was no comment, then this is an insert new operation
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} INSERT comment_id ${JSON.stringify(comment)}`
        );

      // Handle different id types
      if (isNaN(comment.comment_id)) {
        // If the node id has NOT been defined, generate a new node id
        comment.comment_id = m_GetNewCommentID();
      }

      LOGGER.WriteRLog(
        pkt.InfoObj(),
        `insert comment`,
        comment.comment_id,
        JSON.stringify(comment)
      );
      DB.AppendCommentLog(comment, pkt); // log GroupId to node stored in database
      COMMENTS.insert(comment);
      // Return the updated record -- needed to update metadata
      let updatedComment = COMMENTS.findOne({ comment_id: comment.comment_id });
      if (!updatedComment)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find new comment after update!  This should not happen! ${
            comment.comment_id
          } ${JSON.stringify(comment)}`
        );
      retval = { op: 'insert', comment: updatedComment };
    } else if (matches.length === 1) {
      // there was one match to, so update the comment
      COMMENTS.findAndUpdate({ comment_id: comment.comment_id }, c => {
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} UPDATE comment_id ${
              comment.comment_id
            } ${JSON.stringify(comment)}`
          );
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `update comment`,
          comment.comment_id,
          JSON.stringify(comment)
        );
        DB.AppendCommentLog(c, pkt); // log GroupId to node stored in database
        Object.assign(c, comment);
      });
      // Return the updated record -- needed to update metadata

      let updatedComment = COMMENTS.findOne({ comment_id: comment.comment_id });
      if (!updatedComment)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} could not find updated comment after update!  This should not happen! ${
            comment.comment_id
          } ${JSON.stringify(comment)}`
        );
      retval = { op: 'update', comment: updatedComment };
    } else {
      if (DBG)
        console.log(
          PR,
          `WARNING: multiple comment_id ${comment.comment_id} x${matches.length}`
        );
      LOGGER.WriteRLog(
        pkt.InfoObj(),
        `ERROR`,
        comment.comment_id,
        'duplicate comment id'
      );
      retval = { op: 'error-multinodeid' };
    }
    return retval;
  } // if comment

  // PROCESS READBY INSERT/UPDATE
  // NOTE this is a little different than the others because `readbys` is an array of readby objects.
  if (readbys) {
    const retvals = [];
    readbys.forEach(readby => {
      m_CleanObjID(`${pkt.Info()} readby.id`, readby);
      let matches = READBY.find({ comment_id: readby.comment_id });
      if (matches.length === 0) {
        // if there was no readby, then this is an insert new operation
        if (DBG)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} INSERT comment_id ${JSON.stringify(readby)}`
          );

        // Handle different id types
        if (isNaN(readby.comment_id)) {
          // If the node id has NOT been defined, generate a new node id
          throw new Error(
            `server-database.PKT_Update called with invalid comment_id ${JSON.stringify(
              readby
            )}. This should not happen.`
          );
        }

        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `insert readby`,
          readby.comment_id,
          JSON.stringify(readby)
        );
        DB.AppendReadbyLog(readby, pkt); // log GroupId to node stored in database
        READBY.insert(readby);
        // Return the updated record -- needed to update metadata
        let updatedReadby = READBY.findOne({ comment_id: readby.comment_id });
        if (!updatedReadby)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} could not find new readby after update!  This should not happen! ${
              readby.comment_id
            } ${JSON.stringify(readby)}`
          );
        retval = { op: 'insert', readby: updatedReadby };
      } else if (matches.length === 1) {
        // there was one match to, so update the comment
        READBY.findAndUpdate({ comment_id: readby.comment_id }, r => {
          if (DBG)
            console.log(
              PR,
              `PKT_Update ${pkt.Info()} UPDATE comment_id ${
                readby.comment_id
              } ${JSON.stringify(readby)}`
            );
          LOGGER.WriteRLog(
            pkt.InfoObj(),
            `update readby`,
            readby.comment_id,
            JSON.stringify(readby)
          );
          DB.AppendReadbyLog(r, pkt); // log GroupId to node stored in database
          Object.assign(r, readby);
        });
        // Return the updated record -- needed to update metadata

        let updatedReadby = READBY.findOne({ comment_id: readby.comment_id });
        if (!updatedReadby)
          console.log(
            PR,
            `PKT_Update ${pkt.Info()} could not find updated readby after update!  This should not happen! ${
              readby.comment_id
            } ${JSON.stringify(readby)}`
          );
        retval = { op: 'update', readby: updatedReadby };
      } else {
        if (DBG)
          console.log(
            PR,
            `WARNING: multiple comment_id ${readby.comment_id} x${matches.length}`
          );
        LOGGER.WriteRLog(
          pkt.InfoObj(),
          `ERROR`,
          readby.comment_id,
          'duplicate comment id'
        );
        retval = { op: 'error-multinodeid' };
      }
      // NOTE returns an array of retvals for multiple replies
      retvals.push(retval);
    });
    return retvals;
  } // if readby

  // return update value
  return { op: 'error-noaction' };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** NOTE: Unlike PKT_Update, the return value is an array with multiple
 *  results */
DB.PKT_BatchUpdate = function (pkt) {
  let { items } = pkt.Data();
  let retvals = [];
  items.forEach(item => {
    const { comment, commentID, collection_ref } = item;
    // PROCESS COMMENT INSERT/UPDATE
    if (comment) retvals.push(m_CommentUpdate(comment, pkt));
    // DELETE SINGLE COMMENT
    if (commentID !== undefined) retvals.push(m_CommentRemove(commentID, pkt));
    // Trigger derived value update after removal
    if (collection_ref) retvals.push({ op: 'refresh', collection_ref });
  });
  return retvals;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CommentUpdate(comment, pkt) {
  m_CleanObjID(`${pkt.Info()} comment.id`, comment);
  let matches = COMMENTS.find({ comment_id: comment.comment_id });
  if (matches.length === 0) {
    // if there was no comment, then this is an insert new operation
    if (DBG)
      console.log(
        PR,
        `PKT_Update ${pkt.Info()} INSERT comment_id ${JSON.stringify(comment)}`
      );
    // Handle different id types
    if (isNaN(comment.comment_id)) {
      // If the comment id has NOT been defined, generate a new comment id
      comment.comment_id = m_GetNewCommentID();
    }
    LOGGER.WriteRLog(
      pkt.InfoObj(),
      `insert comment`,
      comment.comment_id,
      JSON.stringify(comment)
    );
    DB.AppendCommentLog(comment, pkt); // log GroupId to node stored in database
    COMMENTS.insert(comment);
    // Return the updated record -- needed to update metadata
    let updatedComment = COMMENTS.findOne({ comment_id: comment.comment_id });
    if (!updatedComment)
      console.log(
        PR,
        `PKT_Update ${pkt.Info()} could not find new comment after update!  This should not happen! ${
          comment.comment_id
        } ${JSON.stringify(comment)}`
      );
    retval = { op: 'insert', comment: updatedComment };
  } else if (matches.length === 1) {
    // there was one match to, so update the comment
    COMMENTS.findAndUpdate({ comment_id: comment.comment_id }, c => {
      if (DBG)
        console.log(
          PR,
          `PKT_Update ${pkt.Info()} UPDATE comment_id ${
            comment.comment_id
          } ${JSON.stringify(comment)}`
        );
      LOGGER.WriteRLog(
        pkt.InfoObj(),
        `update comment`,
        comment.comment_id,
        JSON.stringify(comment)
      );
      DB.AppendCommentLog(c, pkt); // log GroupId to node stored in database
      Object.assign(c, comment);
    });
    // Return the updated record -- needed to update metadata

    let updatedComment = COMMENTS.findOne({ comment_id: comment.comment_id });
    if (!updatedComment)
      console.log(
        PR,
        `PKT_Update ${pkt.Info()} could not find updated comment after update!  This should not happen! ${
          comment.comment_id
        } ${JSON.stringify(comment)}`
      );
    retval = { op: 'update', comment: updatedComment };
  } else {
    if (DBG)
      console.log(
        PR,
        `WARNING: multiple comment_id ${comment.comment_id} x${matches.length}`
      );
    LOGGER.WriteRLog(
      pkt.InfoObj(),
      `ERROR`,
      comment.comment_id,
      'duplicate comment id'
    );
    retval = { op: 'error-multinodeid' };
  }
  return retval;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CommentRemove(commentID, pkt) {
  if (DBG) console.log(PR, `PKT_Update ${pkt.Info()} DELETE commentID ${commentID}`);
  // Log first so it's apparent what is triggering the changes
  LOGGER.WriteRLog(pkt.InfoObj(), `delete comment`, commentID);
  COMMENTS.findAndRemove({ comment_id: commentID });
  return { op: 'delete', commentID };
}

/// NODE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the node before writing
 *  the first entry is the insert, subsequent operations are updates */
DB.AppendNodeLog = function (node, pkt) {
  if (!node._nlog) node._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  node._nlog.push(gid);
  if (DBG) {
    let out = '';
    node._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'nodelog', out);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.FilterNodeLog = function (node) {
  let newNode = Object.assign({}, node);
  Reflect.deleteProperty(newNode, '_nlog');
  return newNode;
};

/// EDGE ANNOTATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the node before writing
 *  the first entry is the insert, subsequent operations are updates */
DB.AppendEdgeLog = function (edge, pkt) {
  if (!edge._elog) edge._elog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  edge._elog.push(gid);
  if (DBG) {
    let out = '';
    edge._elog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'edgelog', out);
  }
};
DB.FilterEdgeLog = function (edge) {
  let newEdge = Object.assign({}, edge);
  Reflect.deleteProperty(newEdge, '_elog');
  return newEdge;
};

/// COMMENT ANNOTATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the comment before writing
 *  the first entry is the insert, subsequent operations are updates */
DB.AppendCommentLog = function (comment, pkt) {
  if (!comment._nlog) comment._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  comment._nlog.push(gid);
  if (DBG) {
    let out = '';
    comment._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'commentlog', out);
  }
};
DB.FilterCommentLog = function (comment) {
  let newComment = Object.assign({}, comment);
  Reflect.deleteProperty(newComment, '_nlog');
  return newComment;
};

/// READBY ANNOTATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** write/remove packet SourceGroupID() information into the readby before writing
 *  the first entry is the insert, subsequent operations are updates */
DB.AppendReadbyLog = function (readby, pkt) {
  if (!readby._nlog) readby._nlog = [];
  let gid = pkt.SourceGroupID() || pkt.SourceAddress();
  readby._nlog.push(gid);
  if (DBG) {
    let out = '';
    readby._nlog.forEach(el => {
      out += `[${el}] `;
    });
    console.log(PR, 'readbylog', out);
  }
};
DB.FilterReadbyLog = function (readby) {
  let newReadby = Object.assign({}, readby);
  Reflect.deleteProperty(newReadby, '_nlog');
  return newReadby;
};

/// JSON EXPORT ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by brunch to generate an up-to-date JSON file to path.
 *  creates the path if it doesn't exist */
DB.WriteDbJSON = function (filePath) {
  let dataset = NC_CONFIG.dataset;

  // Ideally we should use m_otions value, but in standlone mode,
  // m_options might not be defined.
  db_file = m_options ? m_options.db_file : m_GetValidDBFilePath(dataset);
  let db = new Loki(db_file, {
    autoload: true,
    autoloadCallback: () => {
      if (typeof filePath === 'string') {
        if (DBG) console.log(PR, `writing { nodes, edges } to '${filePath}'`);
        let nodes = db.getCollection('nodes').chain().data({ removeMeta: false });
        let edges = db.getCollection('edges').chain().data({ removeMeta: false });
        const comments = db
          .getCollection('comments')
          .chain()
          .data({ removeMeta: false });
        const readby = db.getCollection('readby').chain().data({ removeMeta: false });
        let data = { nodes, edges, comments, readby };
        let json = JSON.stringify(data);
        if (DBG) console.log(PR, `ensuring DIR ${PATH.dirname(filePath)}`);
        FSE.ensureDirSync(PATH.dirname(filePath));
        if (DBG) console.log(PR, `writing file ${filePath}`);
        FSE.writeFileSync(filePath, json);
        console.log(PR, `*** WROTE JSON DATABASE ${filePath}`);
      } else {
        console.log(PR, `ERR path ${filePath} must be a pathname`);
      }
    }
  });
};

/// TEMPLATE LOCKING METHODS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by SRV_REQ_TEMPLATE_LOCK. Returns { error, success, uaddr,
 *  lockedBy } */
DB.PKT_RequestLockTemplate = pkt => {
  if (m_template_locks === undefined) return { error: 'template not yet loaded' };
  const uaddr = pkt.s_uaddr;
  if (m_template_locks.size > 0) {
    const uaddrs = [...m_template_locks.keys()];
    if (uaddrs.includes(pkt.s_uaddr)) return { success: true, uaddr: pkt.s_uaddr };
    else
      return {
        error: `template already locked by ${uaddrs}`,
        lockedBy: uaddrs,
        uaddr
      };
  }
  // if we're not locked, lock it!
  m_template_locks.add(uaddr);
  console.log(PR, `${uaddr} locked template`);
  return { success: true, uaddr };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by SRV_REQ_TEMPLATE_UNLOCK. Returns { error, success, uaddr,
 *  lockedBy } */
DB.PKT_RequestUnlockTemplate = pkt => {
  if (m_template_locks === undefined) return { error: 'template not yet loaded' };
  const uaddr = pkt.s_uaddr;
  if (m_template_locks.has(uaddr)) {
    m_template_locks.delete(uaddr);
    console.log(PR, `${uaddr} unlocked template`);
    return { success: true, uaddr };
  }
  const uaddrs = [...m_template_locks.keys()];
  return { error: `template not locked by ${uaddr}`, lockedBy: uaddrs, uaddr };
};

/// TEMPLATE READ+WRITE METHODS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by Template Editor and DB.PKT_WriteTemplateTOML */
function m_GetTemplateTOMLFileName() {
  return NC_CONFIG.dataset + TEMPLATE_EXT;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetTemplateTOMLFilePath() {
  return RUNTIMEPATH + m_GetTemplateTOMLFileName();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DB.GetTemplateTOMLFileName = () => {
  return { filename: m_GetTemplateTOMLFileName() };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** called by Template Editor to save TOML template changes to disk.
 *  @param {object} pkt.data.template
 *  @param pkt.data.path  Will override the current template path in NC_CONFIG.dataset
 *                        Use this to write to the _default template or
 *                        other specific template.
 *  WARN: Loads the template after saving!
 */
DB.PKT_WriteTemplateTOML = pkt => {
  if (pkt.data === undefined)
    throw 'DB.PKT_WriteTemplateTOML pkt received with no `data`';
  const templateFilePath = pkt.data.path || m_GetTemplateTOMLFilePath();
  FSE.ensureDirSync(PATH.dirname(templateFilePath));
  // first back-up the old template file
  if (FSE.existsSync(templateFilePath)) {
    const timestamp = new Date().toISOString().replace(/:/g, '.');
    const backupFilePath =
      RUNTIMEPATH + NC_CONFIG.dataset + '_' + timestamp + TEMPLATE_EXT;
    FSE.copySync(templateFilePath, backupFilePath);
    console.log(PR, 'Backed up template to', backupFilePath);
  }
  // write the new template file
  const toml = TOML.stringify(pkt.data.template);
  try {
    FSE.outputFileSync(templateFilePath, toml);
    m_LoadTemplate();
    return { OK: true, info: templateFilePath };
  } catch (err) {
    console.error(PR, 'Failed trying to save', templateFilePath, err);
    return { OK: false, info: 'Failed trying to save', templateFilePath };
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Clones the existing toml template
    called by brunch to generate an up-to-date Template file to path
    for standalone mode.
    creates the path if it doesn't exist
 */
DB.CloneTemplateTOML = function (filePath) {
  const TOMLPath = m_GetTemplateTOMLFilePath();
  FSE.ensureDirSync(PATH.dirname(TOMLPath));
  // Does the template exist?
  if (!FSE.existsSync(TOMLPath)) {
    console.error(PR, `ERR could not find template ${TOMLPath}`);
  } else {
    FSE.copySync(TOMLPath, filePath);
    console.log(PR, `*** COPIED TEMPLATE ${TOMLPath} to ${filePath}`);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Regenerate Default Template from Template Schema
    Call this when `template-schema.js` changes so that _default.template.toml will
    match the schema defined in `template-schema.js`.
    Use JSCLI `ncRegenerateDefaultTemplate` in the dev console to call this.
 */
DB.RegenerateDefaultTemplate = () => {
  const pkt = {
    data: {
      template: TEMPLATE_SCHEMA.ParseTemplateSchema(),
      path: m_DefaultTemplatePath()
    }
  };
  const toml = TOML.stringify(pkt.data.template);
  return DB.PKT_WriteTemplateTOML(pkt);
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ OPENEDITORS

    Used to coordinate Template editing, Importing, and Node/Edge editing.
    They are mutually exclusive: if one is active, the others should be disabled
    to prevent overwriting data.

    Since Nodes and Edges should not be edited while the Template is being
    edited or data is being imported, any editor that is opened registers
    as an OPENEDITOR.  The UI will also pre-emptively disable edit buttons
    whenever the open editors have been updated via a broacast of the
    `CLI_UPDATE_LOCKSTATE` message by server.js.

    * When a Template editor is open, "Import", "Node Edit", "Edge Edit",
      "Add New Node", and "Add New Edge" buttons are all disabled.
    * When an Import file has been successfully selected and validated,
      "Template", "Node Edit", "Edge Edit", "Add New Node", and
      "Add New Edge" buttons are disabled.
    * When "Node Edit", "Edge Edit", "Add New Node" or "Add New Edge" has
      been triggered, the Template buttons on the Template panel and the
      "Import" pane on the "More" panel are disabled.

    m_open_editors is an array of all the editors (node, edge, template,
    importer) that are currently open.

    Whenever a template is being edited, import is requested, or a node or
    edge is being edited:
    1. They will register with `RequestEditLock`.
    2. When they are finished, they will deregister using `ReleaseEditLock`.
    3. `GetEditStatus` returns the current state of `m_open_editors`.

    UI elements query `GetEditStatus` to figure out what they should
    enable or disable.

    UI elements should also listen to `CLI_UPDATE_LOCKSTATE` to
    enable or disable elements.

    Note that multiple `node` and `edge` editors can be open at the same
    time and ALL must be closed before the lock is released.  We support
    this because each node or edge will have its own entry in m_open_editors,
    though we do not distinguish between the individual nodes/edges.

    Note that this is a different system from the instance-specific Node/Edge
    lock that locks out individual node/edge objects for editing used with
    `PKT_RequestLockNode` and `PKT_RequestLockEdge`.  m_open_editors focuses
    on categories of editor types rather than locking out individual nodes
    and edges to prevent others from editing the same node or edge.

/*/
/**
 * Returns object with flags indicating whether the template is being edited,
 * data is being imported, or node or edge are being edited
 * @returns {templateBeingEdited:boolean, importActive:boolean, nodeOrEdgeBeingEdited:boolean,
 *           lockedNodes:array, lockedEdges:array }
 */
DB.GetEditStatus = pkt => {
  const my_uaddr = pkt.s_uaddr;
  // If there are any 'template' open editors, then templateBeingEdited is true
  const templateBeingEdited = m_open_editors.includes(EDITORTYPE.TEMPLATE);
  // If there are any 'importers' open editors, then importActive is true
  const importActive = m_open_editors.includes(EDITORTYPE.IMPORTER);
  // If there are any 'node' or 'edge' open editors, then nodeOrEdgeBeingEdited is true
  const nodeOrEdgeBeingEdited =
    m_open_editors.length > 0 &&
    (m_open_editors.includes(EDITORTYPE.NODE) ||
      m_open_editors.includes(EDITORTYPE.EDGE));
  // NOT IMPLEMENTED
  // -- This is now problematic with the new optimized state management because
  //    editStatus is being broadcast to ALL clients, not just the one editing
  // Was Used to disable local editing if a comment is being edited, but ignores network comment edits
  // const commentBeingEditedByMe =
  //   [...m_locked_comments.values()].find(
  //     comment_uaddr => comment_uaddr === my_uaddr
  //   ) || false; // returns `false` if not found -- necessary otherwise `commentBeingEditedByMe` is removed and not updated
  return {
    templateBeingEdited,
    importActive,
    nodeOrEdgeBeingEdited,
    // commentBeingEditedByMe, // NOT IMPLEMENTED
    lockedNodes: [...m_locked_nodes.keys()],
    lockedEdges: [...m_locked_edges.keys()],
    lockedComments: [...m_locked_comments.keys()]
  };
};
/**
 * Register a template, import, node or edge as being actively edited.
 * @param {Object} pkt
 * @param {string} pkt.editor - 'template', 'importer', 'node', 'edge', or 'comment'
 * @returns { templateBeingEdited: boolean, importActive: boolean, nodeOrEdgeBeingEdited: boolean, commentBeingEdited: boolean }
 */
DB.RequestEditLock = pkt => {
  m_open_editors.push(pkt.Data().editor);
  console.log(PR, `RequestEditLock: ${pkt.Data().editor} added to open editors`);
  return DB.GetEditStatus(pkt);
};
/**
 * Deregister a import, node or edge as being actively edited.
 * @param {Object} pkt
 * @param {string} pkt.editor - 'template', 'importer', 'node', 'edge', or 'comment'
 * @returns { templateBeingEdited: boolean, importActive: boolean, nodeOrEdgeBeingEdited: boolean, commentBeingEdited: boolean }
 * NOTE: 'template' is no longer handled here
 */
DB.ReleaseEditLock = pkt => {
  const { editor } = pkt.Data();
  const i = m_open_editors.findIndex(e => e === editor);
  if (i > -1) {
    if (DBG)
      console.log(
        PR,
        `ReleaseEditLock: ${editor} found in open editors`,
        m_open_editors
      );
    m_open_editors.splice(i, 1);
    if (DBG) console.log(PR, `ReleaseEditLock: open editors is now`, m_open_editors);
  } else {
    if (DBG)
      console.warn(
        PR,
        `ReleaseEditLock: ${editor} not found in open editors`,
        m_open_editors
      );
  }
  return DB.GetEditStatus(pkt);
};

/// HELPER UTILITIES FOR LOADING DATA /////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Migrates old network data to new formats based on the template defintion.
 *  This will automatically migrate any field/property that is marked `isRequired`
 *  and has a `defaultValue` defined.
 *
 *  The basic check is this:
 *  1. If the TEMPLATE property `isRequired`
 *  2. ...and the TEMPLATE propert has `defaultValue` defined
 *  2. ...and the node/edge property is currently undefined or ``
 *  3. ...then we set the property to the defaultValue
 *
 *  The key parameters:
 *    property.isRequired
 *    property.defaultValue
 *
 *  If `isRequired` or `defaultValue` is not defined on the property, we skip migration.
 *
 *  REVIEW: We might consider also adding type coercion. */
function m_MigrateNodes(nodes) {
  // modifies `nodes` by reference
  // Migrate v1.4 to v2.0
  for (const [propertyName, property] of Object.entries(TEMPLATE.nodeDefs)) {
    if (property.isRequired && property.defaultValue !== undefined) {
      nodes.forEach(n => {
        if (n[propertyName] === undefined || n[propertyName] === '')
          n[propertyName] = property.defaultValue;
      });
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_MigrateEdges(edges) {
  // modifies `edges` by reference
  // Migrate v1.4 to v2.0
  for (const [propertyName, property] of Object.entries(TEMPLATE.edgeDefs)) {
    if (property.isRequired && property.defaultValue !== undefined) {
      edges.forEach(e => {
        if (e[propertyName] === undefined || e[propertyName] === '')
          e[propertyName] = property.defaultValue;
      });
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for cleaning nodes with numeric id property
function m_CleanObjID(prompt, obj) {
  if (typeof obj.id === 'string') {
    let int = parseInt(obj.id, 10);
    LOGGER.WriteRLog(
      {},
      PR,
      `! ${prompt} "${obj.id}" is string; converting to ${int}`
    );
    obj.id = int;
  }
  return obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CleanEdgeEndpoints(prompt, edge) {
  if (typeof edge.source === 'string') {
    let int = parseInt(edge.source, 10);
    LOGGER.WriteRLog(
      {},
      PR,
      `  edge ${prompt} source "${edge.source}" is string; converting to ${int}`
    );
    edge.source = int;
  }
  if (typeof edge.target === 'string') {
    let int = parseInt(edge.target, 10);
    LOGGER.WriteRLog(
      {},
      PR,
      `  edge ${prompt} target "${edge.target}" is string; converting to ${int}`
    );
    edge.target = int;
  }
  return edge;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_CleanID(prompt, id) {
  if (typeof id === 'string') {
    let int = parseInt(id, 10);
    LOGGER.WriteRLog(
      {},
      PR,
      `! ${prompt} "${id}" is string; converting to number ${int}`
    );
    id = int;
  }
  return id;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// utility function for getting a valid file path
function m_GetValidDBFilePath(dataset) {
  // validate dataset name
  let regex = /^([A-z0-9-_+./])*$/; // Allow _ - + . /, so nested pathways are allowed
  if (!regex.test(dataset)) {
    console.error(
      PR,
      `Trying to initialize database with bad dataset name: ${dataset}`
    );
  }

  return RUNTIMEPATH + dataset + '.loki';
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =
module.exports = DB;
