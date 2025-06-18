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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generic Lock Request: editorType is defined in system/util/enum.js. For this
 *  call, 'template' or 'importer' are expected.
 *
 *  ALERT: The 'SRV_REQ_EDIT_LOCK' and related calls are highly weird and
 *  inconsistent in how they call each other across the server and network.
 *  Don't assume a simple MESSAGE => SINGLE OPERATION message flow.
 */
function RequestEditLock(editorType, cb) {
  if (cb)
    UDATA.NetCall('SRV_REQ_EDIT_LOCK', { editor: editorType }).then(data => {
      if (typeof cb === 'function') cb(data);
    });
  else UDATA.NetSignal('SRV_REQ_EDIT_LOCK', { editor: editorType });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Generic Unlock Request: editorType is defined in system/util/enum.js. For this
 *  call, 'template' or 'importer' are expected.
 *
 *  ALERT: The 'SRV_REQ_EDIT_LOCK' and related calls are highly weird and
 *  inconsistent in how they call each other across the server and network.
 *  Don't assume a simple MESSAGE => SINGLE OPERATION message flow.
 */
function RequestEditUnlock(editorType, cb) {
  if (cb)
    UDATA.NetCall('SRV_RELEASE_EDIT_LOCK', { editor: editorType }).then(data => {
      if (typeof cb === 'function') cb(data.locked);
    });
  else UDATA.NetSignal('SRV_RELEASE_EDIT_LOCK', { editor: editorType });
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  RequestLockNode,
  RequestUnlockNode,
  RequestLockEdge,
  RequestUnlockEdge,
  RequestEditLock,
  RequestEditUnlock
};
