/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FOCUSFILTER

  FocusFilter provides the UI for entering the numeric range value for
  the focus filter.

  Selection changes directly trigger a UDATA.LocalCall('FILTER_DEFINE',...).

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import FILTER from './FilterEnums';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCFocusFilter' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFocusFilter({ focusSourceLabel, focusRange }) {
  const [state, setState] = useState({
    focusRange // Used locally to define result
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    BroadcastChange();
  }, [state]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeValue(e) {
    // The built in <input min="0"> will keep the step buttons from going below 0,
    // but the user can still input "0".  We can't just use Math.min() because the
    // user would not be allowed to use backspace to delete the value before
    // entering a new number.  Replacing invalid numbers with a blank value
    // feels like a  more natural way of editing.
    const focusRange = e.target.value < 1 ? '' : e.target.value;
    setState(prevState => ({ ...prevState, focusRange }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function BroadcastChange() {
    // even though we allow "" in the field, we always define the range to be 1
    // so that something will show
    const focusRange = state.focusRange < 1 ? 1 : state.focusRange;
    if (UDATA)
      UDATA.LocalCall('FILTER_DEFINE', {
        group: 'focus',
        filter: {
          value: focusRange
        }
      }); // set a SINGLE filter
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
    <div className="filter-group">
      <h1></h1>
      <form className="filter-item" onSubmit={ui_OnSubmit}>
        <fieldset>
          <label className="help">Selected Node:</label>
          <input type="text" readOnly value={focusSourceLabel} />
        </fieldset>
        <fieldset>
          <label className="help">
            Range <i>(&gt;0)</i>:&nbsp;
          </label>
          <input
            type="number"
            min="1"
            onChange={ui_OnChangeValue}
            value={focusRange}
            aria-label={`Range value`}
          />
        </fieldset>
      </form>
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCFocusFilter;
