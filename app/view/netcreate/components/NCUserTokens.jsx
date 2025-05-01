/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

     Allows admins to define user tokens.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import React, { useState, useRef, useEffect } from 'react';
import UNISYS from 'unisys/client';
import SESSION from 'unisys/common-session';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Initialize UNISYS DATA LINK for react component
const UDATAOwner = { name: 'NCUserTokens' };
const UDATA = UNISYS.NewDataLink(UDATAOwner);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
function NCUserTokens() {
  const DATASET = window.NC_CONFIG.dataset;
  const [state, setState] = useState({
    tokens: '',
    isShareable: false,
    classId: '',
    projId: '',
    hasSalt: false
  });

  const ref_classId = useRef(null);
  const ref_projId = useRef(null);
  const ref_count = useRef(null);

  useEffect(() => {
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    if (TEMPLATE && TEMPLATE.salt !== undefined)
      setState(prevState => ({
        ...prevState,
        hasSalt: true
      }));
  }, []);

  /// UTILITY FUNCTIONS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function validate(str) {
    return str.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  }

  /// UI EVENT HANDLERS ///////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ClassIdInputChange(event) {
    const newClassId = validate(event.target.value);
    setState(prevState => ({
      ...prevState,
      classId: newClassId
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_ProjIdInputChange(event) {
    const newProjId = validate(event.target.value);
    setState(prevState => ({
      ...prevState,
      projId: newProjId
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_SetShareable(event) {
    const isChecked = event.target.checked;
    setState(prevState => ({
      ...prevState,
      isShareable: isChecked,
      tokens: ''
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function evt_MakeTokens() {
    const clsId = ref_classId.current.value;
    const projId = ref_projId.current.value;
    const dataset = state.isShareable ? undefined : DATASET;
    const numGroups = parseInt(ref_count.current.value);
    const result = MakeTokens(clsId, projId, dataset, numGroups);
    console.log('MakeTokens', result, clsId, projId, dataset, numGroups);
    setState(prevState => ({
      ...prevState,
      tokens: result
    }));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Generates a list of tokens using the NetCreate common-session module
   *  REVIEW: Requiring a module from the secondary netcreate-2018 repo
   *  is a little iffy.
   *  @param {string} clsId - classId
   *  @param {string} projId - projectId
   *  @param {string} dataset - database name
   *  @param {integer} numGroups - number of tokens to generate
   *  @return {string}
   */
  function MakeTokens(clsId, projId, dataset, numGroups) {
    // from nc-logic.js
    if (typeof clsId !== 'string')
      return 'args: str classId, str projId, str dataset, int numGroups';
    if (typeof projId !== 'string')
      return 'args: str classId, str projId, str dataset, int numGroups';
    if (!state.isShareable && typeof dataset !== 'string')
      return 'args: str classId, str projId, str dataset, int numGroups';
    if (clsId.length > 12) return 'classId arg1 should be 12 chars or less';
    if (projId.length > 12) return 'classId arg1 should be 12 chars or less';
    if (!Number.isInteger(numGroups)) return 'numGroups arg3 must be integer';
    if (numGroups < 1) return 'numGroups arg3 must be positive integer';

    let out = state.isShareable ? 'Shareable ' : '';
    out += `TOKEN LIST for class '${clsId}' project '${projId}' `;
    out += state.isShareable
      ? 'that can be used for any graph.'
      : `dataset '${dataset}'`;
    out += `\n\n`;
    let pad = String(numGroups).length;
    for (let i = 1; i <= numGroups; i++) {
      let id = String(i);
      id = id.padStart(pad, '0');
      out += `group ${id}\t${SESSION.MakeToken(clsId, projId, i, dataset)}\n`;
    }
    return out;
  }

  /// COMPONENT RENDER ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  return (
    <div id="NCUserTokens">
      <h1>Generate User Tokens</h1>
      <p>
        User tokens are used to identify a user as a node, edge, and comment author.
        They take the form <code>CLASSID-PROJID-HASH</code>. To generate a token,
        enter a class id, a project id, and number of tokens to generate. Then click
        &ldquo;Generate Tokens&rdquo;.
      </p>
      <p>
        &ldquo;Class ID&rdquo; and &ldquo;Project ID&rdquo; can be any short
        alphanumeric (no spaces or punctuation) string less than 12 characters.
      </p>
      <div className="form">
        {!state.isShareable && <label htmlFor="dataset">Graph</label>}
        {!state.isShareable && (
          <input
            id="dataset"
            placeholder="Dataset e.g. 'netcreate'"
            defaultValue={DATASET}
            readOnly
          />
        )}
        <label htmlFor="classid">Class ID</label>
        <input
          id="classid"
          type="text"
          value={state.classId}
          onChange={evt_ClassIdInputChange}
          placeholder="Class ID e.g. 'PER1'"
          ref={ref_classId}
        />
        <label htmlFor="projid">Project ID</label>
        <input
          id="projid"
          type="text"
          value={state.projId}
          onChange={evt_ProjIdInputChange}
          placeholder="Project ID e.g. 'ROME'"
          ref={ref_projId}
        />
        <label htmlFor="count">Number of Tokens</label>
        <input
          id="count"
          type="number"
          placeholder="Num of tokens e.g. '10'"
          defaultValue="10"
          ref={ref_count}
        />
        <div></div>
        <button onClick={evt_MakeTokens} className="cat" role="button">
          Generate Tokens
        </button>
        <div></div>
        <fieldset>
          <legend>Advanced Options</legend>
          {!state.hasSalt && (
            <span style={{ color: 'red', gridColumn: 'span 2' }}>
              WARNING: Project template salt not defined. Tokens will be shareable.
            </span>
          )}
          <input
            id="shareable"
            type="checkbox"
            checked={state.isShareable || !state.hasSalt}
            onChange={evt_SetShareable}
            disabled={!state.hasSalt}
          />
          <label htmlFor="shareable">
            Shareable -- Make tokens usable for ANY graph
          </label>
        </fieldset>
      </div>
      <br />
      <label htmlFor="tokenDisplay">Copy and share these tokens.</label>
      <textarea
        id="tokenDisplay"
        className="no-drag"
        rows="10"
        cols="80"
        placeholder="Tokens will appear here..."
        readOnly
        defaultValue={state.tokens}
      />
    </div>
  );
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default NCUserTokens;
