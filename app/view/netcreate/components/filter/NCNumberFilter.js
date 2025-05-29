/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NUMBERFILTER

  NumberFilter provides the UI for entering search strings for numeric-based
  node and edge properties.

  Seven Numeric  operators are supported:
  * >
  * >=
  * <
  * <=
  * =
  * !=

  Matches will SHOW the resulting node or edge.
  Any nodes/edges not matching will be hidden.

  The filter definition is passed in via props.

    props
      {
        group       // "nodes" or "edges"
        filter: {
          id,       // numeric id used for unique React key
          type,     // filter type, e.g "string" vs "number"
          key,      // node field key from the template
          keylabel, // human friendly display name for the key.
                       This can be customized in the template.
          operator, // the comparison function, e.g. 'contains' or '>'
          value     // the search value to be used for matching
        },
        filterAction // selected action
      }

  The `id` variable allows us to potentially support multiple search filters
  using the same key, e.g. we could have two 'Label' filters.

  In order to retain the input selection cursor between state updates, we use
  a secondary state `inputval` that retains the cursor position.


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useEffect } from 'react';
import UNISYS from 'unisys/client';
import FILTER from './FilterEnums';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCNumberFilter' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const OPERATORS = [
  FILTER.OPERATORS.NO_OP,
  FILTER.OPERATORS.EQ,
  FILTER.OPERATORS.NOT_EQ,
  FILTER.OPERATORS.LT,
  FILTER.OPERATORS.LT_EQ,
  FILTER.OPERATORS.GT,
  FILTER.OPERATORS.GT_EQ
];

/// REACT FUNCTIONAL COMPONENT ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function NCNumberFilter({
  group,
  filter: { id, type, key, keylabel, operator, value },
  filterAction
}) {
  const [state, setState] = useState({
    operator: FILTER.OPERATORS.NO_OP.key, // Used locally to define result
    inputval: '', // Used to maintain input caret position
    value: '' // Used to define the final result
  });

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  useEffect(() => {
    UDATA.HandleMessage('FILTER_CLEAR', urmsg_ClearFilters);
    return () => {
      UDATA.UnhandleMessage('FILTER_CLEAR', urmsg_ClearFilters);
    };
  }, []);

  useEffect(() => {
    BroadcastChange();
  }, [state]);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function urmsg_ClearFilters() {
    setState(prevState => ({ ...prevState, inputval: '' }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeOperator(event) {
    const newstate = { operator: event.target.value };
    // clear value if NO_OP
    if (event.target.value === FILTER.OPERATORS.NO_OP.key) {
      newstate.inputval = '';
      newstate.value = '';
    }
    setState(prevState => ({ ...prevState, ...newstate }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function ui_OnChangeValue(event) {
    const value = Number(event.target.value);
    // First update the input field, retaining cursor position
    // Then send the result
    setState(prevState => ({ ...prevState, inputval: value, value }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function BroadcastChange() {
    // if no data has changed, skip update
    if (operator === state.operator && value === state.value) return;

    const filterDef = {
      id,
      type,
      key,
      keylabel,
      operator: state.operator,
      value: state.inputval
    };
    UDATA.LocalCall('FILTER_DEFINE', {
      group,
      filter: filterDef,
      filterAction
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
    <form className="filter-item" key={id} onSubmit={ui_OnSubmit}>
      <fieldset>
        <label className="help">{keylabel}</label>
        <select
          type="select"
          value={operator}
          onChange={ui_OnChangeOperator}
          aria-label={`${keylabel} filter operator`}
        >
          {OPERATORS.map(op => (
            <option value={op.key} key={`${id}${op.key}`}>
              {op.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={state.inputval}
          placeholder="..."
          onChange={ui_OnChangeValue}
          disabled={operator === FILTER.OPERATORS.NO_OP.key}
          aria-label={`${keylabel} filter value`}
        />
      </fieldset>
    </form>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
export default NCNumberFilter;
