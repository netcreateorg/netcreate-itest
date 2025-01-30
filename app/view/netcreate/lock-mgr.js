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
  - server sends EDIT_PERMISSIONS_UPDATE to all clients
  - EDIT_PERMISSIONS_UPDATE tells lock-mgr to update the LOCKMGR state

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
  UDATA.HandleMessage('EDIT_PERMISSIONS_UPDATE', m_UpdateLockState);
  UDATA.HandleMessage('COMMENT_UPDATE_PERMISSIONS', m_UpdateLockState);
}); // end UNISYS_INIT

/// PRIVATE METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Init() {
  const LOCKSTATE = {
    templateIsBeingEdited: false,
    importActive: false,
    nodeOrEdgeBeingEdited: false,
    commentBeingEditedByMe: false,
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
 * @param {boolean} data.templateIsBeingEdited
 * @param {boolean} data.importActive
 * @param {boolean} data.nodeOrEdgeBeingEdited
 * @param {boolean} data.commentBeingEditedByMe
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

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  RequestLockNode,
  RequestUnlockNode,
  RequestLockEdge,
  RequestUnlockEdge
};
