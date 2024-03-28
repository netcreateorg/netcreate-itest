/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  COMMENT MANAGER

  See UR ADDONS / Comment


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const ReactDOM = require('react-dom');
const UNISYS = require('unisys/client');
const { COMMENT } = require('@ursys/addons');
const DATASTORE = require('system/datastore');
const NCDialog = require('./components/NCDialog');
const SETTINGS = require('settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = 'comment-mgr: ';

/// INITIALIZE MODULE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MOD = UNISYS.NewModule(module.id);
let UDATA = UNISYS.NewDataLink(MOD);
const dialogContainerId = 'dialog-container'; // used to inject dialogs into NetCreate.jsx

/// UNISYS LIFECYCLE HOOKS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** lifecycle INITIALIZE handler
 */
MOD.Hook('INITIALIZE', () => {
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - inside hook
  /** LOAD_COMMENT_DATACORE
   *  Called by nc-logic.m_PromiseLoadDB
   *  Primarily after LOADASSETS
   *  Loads comments from the database into dc-comments
   *  @param {Object} data
   *  @param {Object} data.users
   *  @param {Object} data.commenttypes
   *  @param {Object} data.comments
   */
  UDATA.HandleMessage('LOAD_COMMENT_DATACORE', data => COMMENT.LoadDB(data));
  /// STATE UPDATES and Message Handlers
  UDATA.HandleMessage('COMMENTS_UPDATE', MOD.HandleCOMMENTS_UPDATE);
  UDATA.HandleMessage('COMMENT_UPDATE', MOD.HandleCOMMENT_UPDATE);
  UDATA.HandleMessage('READBY_UPDATE', MOD.HandleREADBY_UPDATE);
  // Currently not used
  // UDATA.OnAppStateChange('COMMENTCOLLECTION', COMMENTCOLLECTION => console.log('comment-mgr.COMMENTCOLLECTION state updated:', COMMENTCOLLECTION));
  // UDATA.OnAppStateChange('COMMENTVOBJS', COMMENTVOBJS => console.error('comment-mgr.COMMENTVOBJS state updated', COMMENTVOBJS));
}); // end INITIALIZE Hook
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** CONFIGURE fires after LOADASSETS, so this is a good place to put TEMPLATE
 *  validation.
 */
MOD.Hook('CONFIGURE', () => {
  if (DBG) console.log('comment-mgr CONFIGURE');
}); // end CONFIGURE Hook

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The APP_READY hook is fired after all initialization phases have finished
 *  and may also fire at other times with a valid info packet
 */
MOD.Hook('APP_READY', function (info) {
  if (DBG) console.log('comment-mgr APP_READY');
}); // end APP_READY Hook


/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

MOD.COMMENTICON = (
  <svg id="comment-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 42">
    <path
      d="M21,0C9.4,0,0,9.4,0,21c0,4.12,1.21,7.96,3.26,11.2l-2.26,9.8,11.56-1.78c2.58,1.14,5.44,1.78,8.44,1.78,11.6,0,21-9.4,21-21S32.6,0,21,0Z"
    />
  </svg>
);

function m_SetAppStateCommentCollections() {
  const COMMENTCOLLECTION = COMMENT.GetCommentCollections();
  UDATA.SetAppState('COMMENTCOLLECTION', COMMENTCOLLECTION);
}

function m_SetAppStateCommentVObjs() {
  const COMMENTVOBJS = COMMENT.GetCOMMENTVOBJS();
  UDATA.SetAppState('COMMENTVOBJS', COMMENTVOBJS);
}

function m_UpdateComment(comment) {
  const cobj = {
    collection_ref: comment.collection_ref,
    comment_id: comment.comment_id,
    comment_id_parent: comment.comment_id_parent,
    comment_id_previous: comment.comment_id_previous,
    comment_type: comment.comment_type,
    comment_createtime: comment.comment_createtime,
    comment_modifytime: comment.comment_modifytime,
    commenter_id: comment.commenter_id,
    commenter_text: comment.commenter_text
  };
  COMMENT.UpdateComment(cobj);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Collection Reference Generators
MOD.GetNodeCREF = nodeId => `n${nodeId}`;
MOD.GetEdgeCREF = edgeId => `e${edgeId}`;
MOD.GetProjectCREF = projectId => `p${projectId}`;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// User Id
MOD.GetCurrentUserId = () => {
  const session = UDATA.AppState('SESSION');
  const uid = session.token;
  return uid;
}
MOD.GetUserName = (uid) => {
  return COMMENT.GetUserName(uid);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Comment Type
MOD.GetCommentTypes = () => {
  return COMMENT.GetCommentTypes();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Comment Collections
MOD.GetCommentCollection = (uiref) => {
  return COMMENT.GetCommentCollection(uiref);
}
/**
 * Marks a comment as read, and closes the component.
 * Called by NCCommentBtn when clicking "Close"
 * @param {Object} uiref comment button id
 * @param {Object} cref collection_ref
 * @param {Object} uid user id
 */
MOD.CloseCommentCollection = (uiref, cref, uid) => {
  if (!MOD.OKtoClose(cref)) {
    // Comment is still being edited, prevent close
    alert('This comment is still being edited!  Please Save or Cancel before closing the comment.')
    return;
  }
  // OK to close
  m_DBUpdateReadBy(cref, uid);
  COMMENT.CloseCommentCollection(uiref, cref, uid);
  m_SetAppStateCommentCollections();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Comment UI State
MOD.GetCommentUIState = uiref => {
  return COMMENT.GetCommentUIState(uiref);
}
/**
 *
 * @param {Object} data
 * @param {Object} data.uiref
 * @param {Object} data.cref
 * @param {Object} data.isOpen
 */
MOD.UpdateCommentUIState = data => {
  COMMENT.UpdateCommentUIState(data);
  m_SetAppStateCommentCollections();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Open Comments
MOD.GetOpenComments = cref => COMMENT.GetOpenComments(cref);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Editable Comments (comments being ddited)

MOD.OKtoClose = cref => {
  const cvobjs = MOD.GetThreadedViewObjects(cref)
  let isBeingEdited = false;
  cvobjs.forEach(cvobj => {
    if (COMMENT.GetCommentBeingEdited(cvobj.comment_id)) isBeingEdited = true
  });
  return !isBeingEdited;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Threaded View Objects
MOD.GetThreadedViewObjects = (cref, uid) => {
  return COMMENT.GetThreadedViewObjects(cref, uid);
}
MOD.GetThreadedViewObjectsCount = (cref, uid) => {
  return COMMENT.GetThreadedViewObjectsCount(cref, uid);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Comment View Objects
MOD.GetCommentVObj = (cref, cid) => {
  return COMMENT.GetCommentVObj(cref, cid);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Comments
MOD.GetComment = (cid) => {
  return COMMENT.GetComment(cid);
}
/**
 *
 * @param {Object} cobj Comment Object
 */
MOD.AddComment = (cobj) => {
  // This just generates a new ID, but doesn't update the DB
  DATASTORE.PromiseNewCommentID().then(newCommentID => {
    cobj.comment_id = newCommentID;
    COMMENT.AddComment(cobj); // creates a comment vobject
    m_SetAppStateCommentVObjs();
  });

}
/**
 * Update the ac/dc comments, then save it to the db
 * This will also broadcast COMMENT_UPDATE so other clients on the network
 * update the data to match the server.
 * @param {Object} cobj
 */
MOD.UpdateComment = (cobj) => {
  COMMENT.UpdateComment(cobj);
  m_DBUpdateComment(cobj);
  m_SetAppStateCommentVObjs();
}
/**
 * Removing a comment can affect multiple comments, so this is done
 * via a batch operation.  We queue up all of the comment changes
 * using the logic for removing/re-arranging the comments in
 * ac-comments/dc-comments, then write out the db updates. This way
 * the db updates can be blindly accomplished in a single operation.
 *
 * Removing is a two step process:
 * 1. Show confirmation dialog
 * 2. Execute the remova
 * @param {Object} parms
 * @param {Object} parms.collection_ref
 * @param {Object} parms.comment_id
 * @param {Object} parms.uid
 */
MOD.RemoveComment = parms => {
  parms.isAdmin = SETTINGS.IsAdmin();
  const confirmRemoveMessage = parms.isAdmin
    ? `Are you sure you want to delete this comment #${parms.comment_id} and ALL related replies (admin only)?`
    : `Are you sure you want to delete this comment #${parms.comment_id}?`;
  const dialog = (
    <NCDialog
      message={confirmRemoveMessage}
      okmessage={`Delete`}
      onOK={event => m_ExecuteRemoveComment(event, parms)}
      cancelmessage="Don't Delete"
      onCancel={m_CloseRemoveCommentDialog}
    />
  );
  const container = document.getElementById(dialogContainerId);
  ReactDOM.render(dialog, container);
}
/**
 * The db call is made AFTER ac/dc handles the removal and the logic of
 * relinking comments.  The db call is dumb, all the logic is in dc-comments.
 * @param {Object} event
 * @param {Object} parms
 * @param {Object} parms.collection_ref
 * @param {Object} parms.comment_id
 * @param {Object} parms.uid
 */
function m_ExecuteRemoveComment(event, parms) {
  const batch = COMMENT.RemoveComment(parms);
  m_DBRemoveComment(batch);
  m_SetAppStateCommentVObjs();
  m_CloseRemoveCommentDialog();
}
function m_CloseRemoveCommentDialog() {
  const container = document.getElementById(dialogContainerId);
  ReactDOM.unmountComponentAtNode(container);
}

/**
 * Respond to network COMMENTS_UPDATE Messages
 * Usually used after a comment deletion to handle a batch of comment updates
 * This can include
 *   * updates to existing comments (marked DELETE or re-linked to other removed comment)
 *   * removal of comment altogether
 * This a network call that is used to update local state for other browsers
 * (does not trigger another DB update)
 * @param {Object[]} dataArray
 */
MOD.HandleCOMMENTS_UPDATE = (dataArray) => {
  if (DBG) console.log('COMMENTS_UPDATE======================');
  const updatedComments = [];
  const removedComments = [];
  dataArray.forEach(data => {
    if (data.comment) updatedComments.push(data.comment);
    if (data.commentID) removedComments.push(data.commentID);
  });
  COMMENT.HandleRemovedComments(removedComments);
  COMMENT.HandleUpdatedComments(updatedComments);

  // and broadcast a state change
  m_SetAppStateCommentCollections();
  m_SetAppStateCommentVObjs();
}
/**
 * Respond to COMMENT_UPDATE Messages from the network
 * After the server/db saves the new/updated comment, COMMENT_UPDATE is
 * broadcast across the network.  This a network call that is used to update
 * the local state to match the server's comments.
 * (does not trigger another DB update)
 * @param {*} data
 */
MOD.HandleCOMMENT_UPDATE = (data) => {
  if (DBG) console.log('COMMENT_UPDATE======================', data);
  const { comment } = data;
  m_UpdateComment(comment);
  // and broadcast a state change
  m_SetAppStateCommentCollections();
  m_SetAppStateCommentVObjs();
}
MOD.HandleREADBY_UPDATE = data => {
  if (DBG) console.log('READBY_UPDATE======================');
  // Not used currently
  // Use this if we need to update READBY status from another user.
  // Since "read" status is only displayed for the current user,
  // we don't need to worry about "read" status updates from other users
  // across the network.
  //
  // The exception to this would be if we wanted to support a single user
  // logged in to multiple browsers.
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// DB Calls
function m_DBUpdateComment(cobj, cb) {
  const comment = {
    collection_ref: cobj.collection_ref,
    comment_id: cobj.comment_id,
    comment_id_parent: cobj.comment_id_parent,
    comment_id_previous: cobj.comment_id_previous,
    comment_type: cobj.comment_type,
    comment_createtime: cobj.comment_createtime,
    comment_modifytime: cobj.comment_modifytime,
    commenter_id: cobj.commenter_id,
    commenter_text: cobj.commenter_text
  };
  UDATA.LocalCall('DB_UPDATE', { comment }).then(data => {
    if (typeof cb === 'function') cb(data);
  });
}
function m_DBUpdateReadBy(cref, uid) {
  // Get existing readby
  const cvobjs = COMMENT.GetThreadedViewObjects(cref, uid);
  const readbys = [];
  cvobjs.forEach(cvobj => {
    const commenter_ids = COMMENT.GetReadby(cvobj.comment_id) || [];
    // Add uid if it's not already marked
    if (!commenter_ids.includes(uid)) commenter_ids.push(uid);
    const readby = {
      comment_id: cvobj.comment_id,
      commenter_ids
    };
    readbys.push(readby);
  })
  UDATA.LocalCall('DB_UPDATE', { readbys }).then(data => {
    if (typeof cb === 'function') cb(data);
  });
}
/**
 * Executes multiple database operations via a batch of commands:
 * - `cobjs` will be updated
 * - `commentIDs` will be deleted
 * @param {Object[]} items [ ...cobj, ...commentID ]
 * @param {function} cb callback
 */
function m_DBRemoveComment(items, cb) {
  UDATA.LocalCall('DB_BATCHUPDATE', { items }).then(data => {
    if (typeof cb === 'function') cb(data);
  });
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MOD;