/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Filter Group Properties

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCFilterGroupProperties' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);

/// CLASS DECLARATIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFilterGroupProperties({ group, transparency }) {
  // Currently inconsistent because not passing in a key, etc.
  // if we expand on this notion of group-leve globals we'll need to update
  // the format / approach
  const [state, setState] = useState({
    group,
    inputval: transparency, // Used to maintain input caret position
    transparency
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    BroadcastChange();
  }, [state]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // this is overkill to have these be separate, but mirroring the other filter components and aiming
  // to have future additional properties here, so this way the flow won't change (change functions call trigger change)
  function BroadcastChange() {
    // if no data has changed, skip update
    if (transparency === state.transparency) return;

    // for debugging
    // console.log(
    //   'Filter group for ' +
    //     this.state.group +
    //     ' setting transparency to ' +
    //     this.state.transparency
    // );

    // set the transparency globally for this group (nodes or edges)
    UDATA.LocalCall('FILTER_DEFINE', {
      group,
      type: 'transparency',
      transparency: state.inputval
    }); // set a SINGLE filter
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeValue(event) {
    setState(prevState => ({
      ...prevState,
      inputval: event.target.value,
      transparency
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnSubmit(event) {
    // Prevent "ENTER" from triggering form submission!
    event.preventDefault();
    event.stopPropagation();
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div>
      <br />
      <form className="filter-item" key={group} onSubmit={ui_OnSubmit}>
        <fieldset>
          <label className="help"> Transparency&nbsp;</label>
          <input
            type="text"
            value={state.inputval}
            onChange={ui_OnChangeValue}
            aria-label={`Transparency filter value`}
          />
        </fieldset>
      </form>
    </div>
  );
}

/// EXPORT CLASS DEFINITION ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCFilterGroupProperties;
