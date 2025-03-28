/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FOCUSFILTER

  FocusFilter provides the UI for entering the numeric range value for
  the focus filter.

  Selection changes directly trigger a UDATA.LocalCall('FILTER_DEFINE',...).

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import NCAutoSuggest from '../NCAutoSuggest';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCFocusFilter' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCFocusFilter({ focusSourceLabel, focusRange }) {
  const [state, setState] = useState({
    focusInputLabel: focusSourceLabel, // Used locally to define result
    focusRange // Used locally to define result
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    BroadcastChange();
  }, [state]);
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    setState(prevState => ({ ...prevState, focusInputLabel: focusSourceLabel })); // update local state
  }, [focusSourceLabel]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_NodeInputUpdate(key, value) {
    setState(prevState => ({ ...prevState, focusInputLabel: value })); // update local state
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * User has selected a node with NCAutoSuggest, either
   * - Clicking on a suggested node
   * - Hitting Enter with the form field showing either a valid node or a new node
   * @param {string} key is 'id' or 'label'
   * @param {string} label
   * @param {number} id
   */
  function ui_NodeSelect(key, label, id) {
    if (UDATA) {
      const NCDATA = UDATA.AppState('NCDATA');
      const foundNode = NCDATA.nodes.find(n => n.id === id);
      if (foundNode)
        UDATA.LocalCall('FILTER_DEFINE', {
          group: 'focus',
          filter: {
            source: id,
            sourceLabel: foundNode.label
          }
        }); // set a SINGLE filter
    }
    // this.ValidateSourceTarget(key, label, id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeValue(e) {
    // The built in <input min="0"> will keep the step buttons from going below 0,
    // but the user can still input "0".  We can't just use Math.min() because the
    // user would not be allowed to use backspace to delete the value before
    // entering a new number.  Replacing invalid numbers with a blank value
    // feels like a more natural way of editing.
    const focusRange = e.target.value < 1 ? '' : Number(e.target.value);
    setState(prevState => ({ ...prevState, focusRange }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_DeselectNode(e) {
    UDATA.LocalCall('FILTER_DEFINE', {
      group: 'focus',
      filter: {
        deselectNode: true // hacky -- force m_FilterDefine to clear the selection
      }
    });
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
          range: focusRange
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

  // show button if node is selected
  // else show autosuugst
  // clicking enables autosuggest
  let selectedNodeJsx;
  let selectedNodeHelp;
  if (focusSourceLabel) {
    selectedNodeJsx = (
      <button type="button" className="focusnode" onClick={ui_DeselectNode}>
        {focusSourceLabel}
      </button>
    );
    selectedNodeHelp = 'Click to select another node';
  } else {
    selectedNodeJsx = (
      <NCAutoSuggest
        value={state.focusInputLabel}
        onChange={ui_NodeInputUpdate}
        onSelect={ui_NodeSelect}
      />
    );
    selectedNodeHelp = 'Click a node or type a node name..';
  }

  return (
    <div className="filter-group">
      <h1></h1>
      <form className="filter-item" onSubmit={ui_OnSubmit}>
        <fieldset>
          <label className="help"></label>
          <p className="help">{selectedNodeHelp}</p>
        </fieldset>
        <fieldset>
          <label className="help">Selected Node:</label>
          {selectedNodeJsx}
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
