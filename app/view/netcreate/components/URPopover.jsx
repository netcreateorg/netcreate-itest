/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generic Floating, Draggable, Closeable Window

  USE:

    <URPopover
      dialog={CMTSTATUS.dialog}
    />

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState } from 'react';
import Draggable from 'react-draggable';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'URPopover';

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function URPopover({ title, onClose, children, className }) {
  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const BTN_CLOSE = (
    <button
      className="icon"
      type="button"
      role="button"
      aria-label="Close"
      onClick={onClose}
    >
      <img src="images/icn_plus.svg" alt="" />
    </button>
  );
  return (
    <Draggable cancel="input, textarea, select, button, .no-drag">
      <div id="popover" className={className}>
        <div className="popover-toolbar">
          {title}
          {BTN_CLOSE}
        </div>
        <div className="popover-content">{children}</div>
      </div>
    </Draggable>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default URPopover;
