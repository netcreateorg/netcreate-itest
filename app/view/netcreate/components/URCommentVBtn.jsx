/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URCommentVBtn

  NOTE: This is a different implementation from Net.Create's.
        MEME's URCommentVBtn
        * uses props only for id (instead of ALL parameters)
        * id is `cref` (instead of `uiref)`
        * comment state is derived from global state objects (not props)

  A display button that calls URCommentCollectionMgr to open comments.
  It emulates the visual functionality of URCommentBtn but is not a parent
  of the URCommentThread and does not directly handle the opening and closing
  of URCommentThreads.  URCommentThreads are opened separately via
  URCommentCollectionMgr.

  FUNCTIONALITY:
    URCommentVBtn does five things:
    1. Displays whether the comment thread is open (bordered) or closed (no border)
    2. Displays the number of comments in the thread
    3. Provides the position of the source component requesting the thread
    4. Requests URCommentCollectionMgr to open the comment thread
    5. Requests URCommentCollectionMgr to close the comment thread
    4. // REVIEW: isDisabled is not used -- where do we get that status forom?

  USE:

    <URCommentVBtn
      cref={collection_ref}
    />

  PROPS:
    * cref    -- collection reference (usu node id, edge id)

  USED BY:
    * URCommentStatus > URCommentCollectionMgr
    * Navbar
    * ELink

  NOTE unlike URCommentBtn, URCommentVBtn does not use the unique user
  interface id (uuiid) to differentiate comment buttons on EVLinks vs props.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect, useRef } from 'react';
import UNISYS from 'unisys/client';
import CMTMGR from '../comment-mgr';
import URCommentSVGBtn from './URCommentSVGBtn';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for functional react component
const UDATAOwner = { name: 'URCommentVBtn' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// Debug Flags
const DBG = false;
const PR = 'URCommentVBtn';

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** URCommentVBtn
 *  @param {string} cref - Collection reference
 *  @returns {React.Component} - URCommentVBtn
 */
function URCommentVBtn({ cref }) {
  const btnRef = useRef(null);
  const [state, setState] = useState({
    count: 0,
    hasUnreadComments: false,
    hasReadComments: false,
    isOpen: false
  });

  /// USEEFFECT ///////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    c_Update();
    // Handlers
    UDATA.OnAppStateChange('COMMENTCOLLECTION', urstate_UpdateCollection, UDATAOwner);
    UDATA.OnAppStateChange('COMMENTVOBJS', urstate_UpdateVObj, UDATAOwner);
    // window.addEventListener('resize', evt_OnResize);
    // clean up on unmount
    return () => {
      UDATA.AppStateChangeOff('COMMENTCOLLECTION', urstate_UpdateCollection);
      UDATA.AppStateChangeOff('COMMENTVOBJS', urstate_UpdateVObj, UDATAOwner);
      // window.removeEventListener('resize', evt_OnResize);
    };
  }, []);

  useEffect(() => {
    c_Update();
  }, [cref]);

  /// UR HANDLERS /////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function urstate_UpdateCollection(COMMENTCOLLECTION) {
    c_Update();
  }
  function urstate_UpdateVObj(COMMENTVOBJS) {}

  /// COMPONENT HELPER METHODS ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function c_Update() {
    const ccol = CMTMGR.GetCommentCollection(cref) || {};
    const { hasReadComments, hasUnreadComments } = ccol;

    const uistate = CMTMGR.GetCommentUIState(cref);
    const isOpen = uistate ? uistate.isOpen : false;

    // commentCountLabel
    const commentCount = CMTMGR.GetCommentCollectionCount(cref);

    setState({
      count: commentCount,
      hasUnreadComments,
      hasReadComments,
      isOpen
    });
  }
  /// COMPONENT UI HANDLERS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle URCommentBtn click, which opens and closes the URCommentThread */
  function evt_OnClick(event) {
    event.stopPropagation();
    if (state.isOpen) {
      // is currently open, so close it
      const uid = CMTMGR.GetCurrentUserId();
      CMTMGR.CloseCommentCollection(cref, cref, uid);
    } else {
      // is currently closed, so open it
      CMTMGR.OpenCommentCollectionByCref(cref);
    }
  }
  /// DEPRECATED FOR NOW
  /// -- URCommentCollectionMgr should handle window resize?
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // /** handles window resize, which will adjust the URCommentThread window
  //  *  position relative to the resized location of the URCommentBtn
  //  */
  // function evt_OnResize() {
  //   const position = c_GetCommentThreadPosition();
  //   setPosition(position);
  // }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div ref={btnRef}>
      <URCommentSVGBtn
        uiref={cref}
        count={state.count}
        hasUnreadComments={state.hasUnreadComments}
        hasReadComments={state.hasReadComments}
        selected={state.isOpen}
        onClick={evt_OnClick}
        ariaLabel={`Comments (${state.count})`}
      />
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default URCommentVBtn;
