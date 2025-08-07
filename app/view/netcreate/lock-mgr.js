/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  lock-mgr

  lock-mgr maintains the LOCKMGR app state, which is used to track the
  status of locks on nodes, edges, and comments.

  When a lock is requested or released, LOCKMGR state is updated.
  Any components that are subscribed to the state update will be notified.

  Calls
  - RequestLockNode
  - RequestUnlockNode
  - RequestLockEdge
  - RequestUnlockEdge

  How it works
  - A component requests a lock, e.g. NCNode.LockNode
    which calls LOCKMGR.RequestLockNode
  - lock-mgr makes to request to the server
  - server passes the call to server-database.GetEditStatus
  - server-database returns the new value
  - server sends CLI_UPDATE_LOCKSTATE to all clients
  - CLI_UPDATE_LOCKSTATE tells lock-mgr to update the LOCKMGR state

  Used by:
  - NCNode
  - NCEdge


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const UNISYS = require('unisys/client');
const { EDITORTYPE } = require('system/util/enum');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'lock-mgr: ';
const LOG = DBG ? console.log.bind(console) : () => {};

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const MOD = UNISYS.NewModule(module.id);
const UDATA = UNISYS.NewDataLink(MOD);

/// UTILITIES /////////////////////////////////////////////////////////////////

/// LIFECYCLE HANDLERS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ lifecycle INITIALIZE handler
/*/
MOD.Hook('INITIALIZE', () => {
  m_Init();
  UDATA.HandleMessage('CLI_UPDATE_LOCKSTATE', m_UpdateLockState);
  UDATA.HandleMessage('COMMENT_UPDATE_PERMISSIONS', m_UpdateLockState);
}); // end UNISYS_INIT

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Init() {
  const LOCKSTATE = {
    templateBeingEdited: false,
    importActive: false,
    nodeOrEdgeBeingEdited: false,
    // commentBeingEditedByMe: false, // NOT IMPLEMENTED
    lockedNodes: [],
    lockedEdges: [],
    lockedComments: []
  };
  UDATA.SetAppState('LOCKSTATE', LOCKSTATE);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *
 * @param {object} data
 * @param {boolean} data.templateBeingEdited
 * @param {boolean} data.importActive
 * @param {boolean} data.nodeOrEdgeBeingEdited
//  * @param {boolean} data.commentBeingEditedByMe // NOT IMPLEMENTED
 * @param {Array} data.lockedNodes
 * @param {Array} data.lockedEdges
 * @param {Array} data.lockedComments
 */
function m_UpdateLockState(data) {
  const LOCKSTATE = UDATA.AppState('LOCKSTATE');
  UDATA.SetAppState('LOCKSTATE', { ...LOCKSTATE, ...data });
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RequestLockNode(nodeId, cb) {
  UDATA.Call('SRV_DBLOCKNODE', { nodeID: nodeId }).then(data => {
    if (typeof cb === 'function') cb(data.locked);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RequestUnlockNode(nodeId, cb) {
  UDATA.Call('SRV_DBUNLOCKNODE', { nodeID: nodeId }).then(data => {
    if (typeof cb === 'function') cb(data.locked);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RequestLockEdge(edgeId, cb) {
  UDATA.Call('SRV_DBLOCKEDGE', { edgeID: edgeId }).then(data => {
    if (typeof cb === 'function') cb(data.locked);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RequestUnlockEdge(edgeId, cb) {
  UDATA.Call('SRV_DBUNLOCKEDGE', { edgeID: edgeId }).then(data => {
    if (typeof cb === 'function') cb(data.locked);
  });
}

/// NEW TEMPLATE LOCKING SYSTEM ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Request a lock on the template being edited if it's available,
 *  using new lock manager system added in 2025. */
async function RequestTemplateLock() {
  const lockState = await UDATA.Call('SRV_REQ_TEMPLATE_LOCK');
  const { success, uaddr, error, lockedBy } = lockState;
  if (error) {
    LOG(PR, 'LockTemplate failed:', lockState);
    m_UpdateLockState({ templateBeingEdited: false });
  } else if (success) {
    LOG(PR, 'LockTemplate succeeded:', lockState);
    m_UpdateLockState({ templateBeingEdited: true });
  } else {
    LOG(PR, 'LockTemplate returned unexpected state:', lockState);
  }
  return lockState;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Release the lock on the template being edited using new lock manager
 *  system added in 2025. */
async function RequestTemplateUnlock() {
  const lockState = await UDATA.Call('SRV_REQ_TEMPLATE_UNLOCK');
  const { success, error } = lockState;
  LOG(PR, 'RequestTemplateUnlock returned:', lockState);
  if (error) {
    LOG(PR, `error: ${error}`);
    return lockState;
  }
  if (success) {
    LOG(PR, 'UnlockTemplate succeeded:', lockState);
    m_UpdateLockState({ templateBeingEdited: false });
    return lockState;
  }
  LOG(PR, 'UnlockTemplate returned unexpected state:', lockState);
  return lockState;
}

/// OLD TERRIBLE CALLS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generic Lock Request: editor types is defined in system/util/enum.js.
 *  For this call, 'template' or 'importer' are expected. */
async function RequestEditLock(editor) {
  if (editor !== EDITORTYPE.TEMPLATE && editor != EDITORTYPE.IMPORTER) {
    return {
      error: `Skipped invalid editor ${editor} for edit lock request`
    };
  }
  const status = await UDATA.Call('SRV_REQ_EDIT_LOCK', { editor });

  return status;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generic Unlock Request: editorType is defined in system/util/enum.js.
 *  For this call, 'template' or 'importer' are expected. */
async function RequestEditUnlock(editor) {
  if (editor !== EDITORTYPE.TEMPLATE && editor != EDITORTYPE.IMPORTER) {
    return {
      error: `Skipped invalid editor ${editor} for edit lock release`
    };
  }
  const status = await UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor });
  return status;
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  RequestTemplateLock,
  RequestTemplateUnlock,
  RequestLockNode,
  RequestUnlockNode,
  RequestLockEdge,
  RequestUnlockEdge,
  RequestEditLock,
  RequestEditUnlock
};
