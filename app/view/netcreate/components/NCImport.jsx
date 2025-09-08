/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  Provides tools to import and export node/edge data files.

  This also provides a "Force Unlock All" button that can be used by Admins
  to unlock all edit locks requested by node editors, edge editors, template
  editors, and importers on the network.

  This displays a subpanel on the "More..." tab.


  ## PRIVILEGES

  There are two levels of privileges for this panel:
  - Admins
  - Logged in users with "allowLoggedInUserToImport" set to true

  Only admins are allowed to
  - import data (nodes/edges)
  - export templates
  - import templates
  This is set via an `isAdmin` prop.

  Logged in users with "allowLoggedInUserToImport" set to true are allowed to
  - import data (nodes/edges)


  ## USAGE

    <NCImportExport isAdmin={isAdmin} templateIsBeingEditedByMe={templateIsBeingEditedByMe} />

  templateIsBeingEditedByMe is used to by NCAdvancedPanel to coordinate the
  lock/unlock template editting across all the NCAdvancedPanel

  `importexport-mgr.js` (IMPORTEXPORT) handles all of the business logic for
  importing and exporting.  See that file for details.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const NetMessage = require('unisys/common-netmessage-class');

const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');
const { EDITORTYPE } = require('system/util/enum');

const IMPORTEXPORT = require('../importexport-mgr');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCImport';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NODEFILESTATUS_DEFAULT = 'Select a node .csv file to import';
const EDGEFILESTATUS_DEFAULT = 'Select an edge .csv file to import';
const IMPORTTYPE = {
  MERGE: 'merge',
  REPLACE: 'replace'
};

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCImport extends UNISYS.Component {
  constructor(props) {
    super(props);
    const TEMPLATE = this.AppState('TEMPLATE');
    this.state = {
      preventImport: false, // an external source has disabled import for us
      importIsActive: false, // internal source: keeps track of whether THIS panel has valid import files selected
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodeValidationMsgs: undefined,
      nodeOkToImport: false,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgeValidationMsgs: undefined,
      edgeOkToImport: false,
      okToImport: false,
      importMsgs: undefined,
      allowLoggedInUserToImport: TEMPLATE.allowLoggedInUserToImport
    };
    this.checkUnload = this.checkUnload.bind(this);
    this.doUnload = this.doUnload.bind(this);
    this.urstate_LOCKSTATE = this.urstate_LOCKSTATE.bind(this);
    this.updateEditState = this.updateEditState.bind(this);
    this.onNodeImportFileSelect = this.onNodeImportFileSelect.bind(this);
    this.onEdgeImportFileSelect = this.onEdgeImportFileSelect.bind(this);
    this.clearNodefileSelect = this.clearNodefileSelect.bind(this);
    this.clearEdgefileSelect = this.clearEdgefileSelect.bind(this);
    this.clearFileSelect = this.clearFileSelect.bind(this);
    this.onDoImport = this.onDoImport.bind(this);
    this.unlockAll = this.unlockAll.bind(this);

    this.OnAppStateChange('LOCKSTATE', this.urstate_LOCKSTATE);
  } // constructor

  componentDidMount() {
    // Update Lockstate on mount
    const LOCKSTATE = this.AppState('LOCKSTATE');
    this.urstate_LOCKSTATE(LOCKSTATE);
    this.updateEditState();
    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }

  componentWillUnmount() {
    this.AppStateChangeOff('LOCKSTATE', this.urstate_LOCKSTATE);
    window.removeEventListener('beforeunload', this.checkUnload);
    window.removeEventListener('unload', this.doUnload);
  }

  checkUnload(e) {
    e.preventDefault();
    if (this.state.importIsActive) {
      (e || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(e, 'returnValue');
    }
    return e;
  }

  doUnload(e) {
    if (this.state.importIsActive) {
      this.NetSignal('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    }
  }

  /// UI EVENT HANDLERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  urstate_LOCKSTATE(LOCKSTATE) {
    const { importIsActive } = this.state;
    // always set preventImport even if you're not an admin in case admin status changes
    if (!importIsActive) {
      const preventImport =
        !this.props.templateIsBeingEditedByMe ||
        LOCKSTATE.templateBeingEdited ||
        LOCKSTATE.importActive ||
        LOCKSTATE.nodeOrEdgeBeingEdited ||
        UNISYS.IsStandaloneMode();
      this.setState({ preventImport });
    }
  }

  updateEditState() {
    // REVIEW: Reduce setState calls?
    DATASTORE.PromiseCalculateMaxNodeId().then(data => {
      this.setState({ nextNodeId: data + 1 });
    });
    DATASTORE.PromiseCalculateMaxEdgeId().then(data => {
      this.setState({ nextEdgeId: data + 1 });
    });
  }


  onNodeImportFileSelect(e) {
    const nodefile = e.target.files[0];
    IMPORTEXPORT.NodefileValidate({ nodefile }).then(result => {
      const msg = (
        <div>
          <div>{result.messageTitle}</div>
          {result.messageJsx}
        </div>
      );
      // if edge file was already okToImport, then this remains OK.
      const okToImport = this.state.edgeOkToImport || result.isValid;
      this.setState({
        nodeOkToImport: result.isValid,
        okToImport,
        nodefileStatus: result.isValid ? 'Ready to Import' : NODEFILESTATUS_DEFAULT,
        nodeValidationMsgs: msg,
        importMsgs: undefined
      });
      // Clear "Choose File"
      if (!result.isValid) document.getElementById('nodefileInput').value = '';
    });
  }
  onEdgeImportFileSelect(e) {
    const edgefile = e.target.files[0];
    IMPORTEXPORT.EdgefileValidate({ edgefile }).then(result => {
      const msg = (
        <div>
          <div>{result.messageTitle}</div>
          {result.messageJsx}
        </div>
      );
      // if edge file was already okToImport, then this remains OK.
      const okToImport = this.state.nodeOkToImport || result.isValid;
      this.setState({
        edgeOkToImport: result.isValid,
        okToImport,
        edgefileStatus: result.isValid ? 'Ready to Import' : EDGEFILESTATUS_DEFAULT,
        edgeValidationMsgs: msg,
        importMsgs: undefined
      });
      // Clear "Choose File"
      if (!result.isValid) document.getElementById('edgefileInput').value = '';
    });
  }

  clearNodefileSelect() {
    // User Cancelled, reset to default
    // If edge import is active, then import remains active
    const importIsActive = this.state.importIsActive || false;
    this.setState({
      importIsActive,
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodeValidationMsgs: undefined
    });
    // Clear validated data so it doesn't get imported
    if (!importIsActive)
      this.NetSend('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    IMPORTEXPORT.ResetNodeImportData();
  }

  clearEdgefileSelect() {
    // User Cancelled, reset to default
    // If node import is active, then import remains active
    const importIsActive = this.state.importIsActive || false;
    this.setState({
      importIsActive,
      edgefile: undefined,
      edgefileStatus: EDGEFILESTATUS_DEFAULT,
      edgeValidationMsgs: undefined
    });
    // Clear validated data so it doesn't get imported
    if (!importIsActive)
      this.NetSend('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    IMPORTEXPORT.ResetEdgeImportData();
  }

  clearFileSelect() {
    // User Cancelled, reset to default
    this.NetSend('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
    document.getElementById('nodefileInput').value = '';
    document.getElementById('edgefileInput').value = '';
    this.clearNodefileSelect();
    this.clearEdgefileSelect();

    IMPORTEXPORT.ResetImportData();
    this.setState({
      nodeValidationMsgs: undefined,
      edgeValidationMsgs: undefined,
      importMsgs: undefined
    });
  }

  onDoImport() {
    if (DBG) console.log(PR, 'onDoImport');
    const replace = document.getElementById('import-replace').checked;
    IMPORTEXPORT.Import(replace).then(result => {
      this.setState({
        okToImport: false, // imported, so hide "Import" button
        nodeOkToImport: false,
        edgeOkToImport: false,
        importMsgs: result.messageJsx || 'OK',
        nodeValidationMsgs: '',
        edgeValidationMsgs: '',
        nodefileStatus: NODEFILESTATUS_DEFAULT,
        edgefileStatus: EDGEFILESTATUS_DEFAULT
      });
      document.getElementById('nodefileInput').value = '';
      document.getElementById('edgefileInput').value = '';
    });
  }

  unlockAll() {
    this.NetCall('SRV_DBUNLOCKALL');
  }

  /// REACT LIFECYCLE METHODS ///////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  render() {
    const {
      preventImport,
      importIsActive,
      nodefileStatus,
      edgefileStatus,
      importMsgs,
      allowLoggedInUserToImport,
      nextNodeId,
      nextEdgeId,
      nodeValidationMsgs,
      edgeValidationMsgs,
      okToImport
    } = this.state;
    const { isAdmin, templateIsBeingEditedByMe } = this.props;

    // Set Import Permissions
    // -- Admins can always import
    // -- If allowLoggedInUserToImport, logged in users can also import
    const isLoggedIn = NetMessage.GlobalGroupID();
    const importDisabled = !(isAdmin || (allowLoggedInUserToImport && isLoggedIn));
    const importBtnDisabled = !okToImport;


    let importjsx;
    if (isAdmin && preventImport && !importIsActive && !templateIsBeingEditedByMe) {
      importjsx = (
        <div className="panel">
          <p style={{ color: `var(--clr-warning)` }}>
            <i>
              You cannot import data while someone is editing a node, edge, or
              template, or in standalone view.
            </i>
          </p>
          <p>
            <i>Please finish editing and try again.</i>
          </p>
        </div>
      );
    } else {
      importjsx = (
        <div className="panel" hidden={importDisabled}>
          <h1>Import Data</h1>
          <p className="system">Import .csv data</p>
          <p>
            To specify node and edge IDs in your import file, use the next unused ID:
          </p>
          <ul>
            <li>Next unused NODE ID: {nextNodeId}</li>
            <li>Next unused EDGE ID: {nextEdgeId}</li>
          </ul>
          <p> </p>
          <h2>Replace vs Merge</h2>
          <fieldset>
            <label>
              <input
                id="import-merge"
                type="radio"
                name="importtype"
                value={IMPORTTYPE.MERGE}
                defaultChecked
              />
              Merge
            </label>
            <div>
              <p>
                <b>Merge</b> the new nodes and edges into the existing nodes and
                edges. Use this to add additional data to an existing project.
              </p>
              <ul>
                <li>
                  Imported nodes/edges with matching ids will replace existing objects
                </li>
                <li>
                  Existing objects that do not match imported nodes/edges will not be
                  modified or removed
                </li>
              </ul>
            </div>
            <label>
              <input
                id="import-replace"
                type="radio"
                name="importtype"
                value={IMPORTTYPE.REPLACE}
              />
              Replace
            </label>
            <div>
              <p>
                {' '}
                <b>Replace</b> existing nodes and edges. Use this to <b>load</b> a new
                project
              </p>
              <ul>
                <li style={{ color: `var(--clr-warning)` }}>
                  WARNING: All existing nodes and edges will be removed before new
                  nodes and edges are imported. If you do not include an Edges file,
                  all edges will be removed.
                </li>
              </ul>
            </div>
          </fieldset>
          <p></p>
          <h2>Nodes</h2>
          <div className="file-import">
            <input
              type="file"
              accept="text/csv"
              id="nodefileInput"
              onInput={this.onNodeImportFileSelect}
              onClick={e => {
                // Clear the selected node file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad node file.
                this.clearNodefileSelect();
              }}
            />
            <label htmlFor="nodefileInput" className="system">
              {nodefileStatus}
            </label>
          </div>
          <h2>Edges</h2>
          <div className="file-import">
            <input
              type="file"
              accept="text/csv"
              id="edgefileInput"
              onInput={this.onEdgeImportFileSelect}
              onClick={e => {
                // Clear the selected edge file whenever "Choose File" is clicked so that if the user
                // cancels, the form is reset to a blank state.  This is necessary to clear out
                // validation errors after selecting a bad edge file.
                this.clearEdgefileSelect();
              }}
            />
            <label htmlFor="edgefileInput" className="system">
              {edgefileStatus}
            </label>
          </div>
          {okToImport && (
            <div className="buttonbar importbuttons">
              <button
                className={`small ${importBtnDisabled ? '' : 'cat'}`}
                type="button"
                disabled={importBtnDisabled}
                onClick={this.onDoImport}
              >
                Import
              </button>
              <label>
                <button
                  className="small"
                  type="button"
                  onClick={this.clearFileSelect}
                >
                  Clear File Selections
                </button>
              </label>
            </div>
          )}
          <fieldset className="validationMessages">
            <legend>Import Status</legend>
            {nodeValidationMsgs && <div>{nodeValidationMsgs}</div>}
            {edgeValidationMsgs && <div>{edgeValidationMsgs}</div>}
            {importMsgs && <div>{importMsgs}</div>}
          </fieldset>
        </div>
      );
    }

    let unlockAlljsx;
    if (isAdmin) {
      unlockAlljsx = (
        <div className="panel">
          <h1>Admin Tools</h1>
          <p>Unlock ALL Template, Import, Node, and Edge Editing.</p>
          <p>
            When someone on the network is editing a template, importing data, or
            editing a node or edge, everyone else on the network is prevented from
            editing a template or importing data and editing nodes and edges.
          </p>
          <p>
            ADMINS: Use this force the server to release the lock on editing if you
            know the lock was left on in error, e.g. you know that there is no one on
            the network actively editing a template, importing, editing a node or an
            edge.
          </p>
          <p>
            <b>WARNING</b>: Use this with utmost caution! If someone is actively
            editing or importing, you can delete their work, or even worse,{' '}
            <b>corrupt the database!</b>
          </p>
          <button className="small warning" type="button" onClick={this.unlockAll}>
            Force Unlock All
          </button>
        </div>
      );
    }

    return (
      <div className="NCImportExport">
        {importjsx}
        {unlockAlljsx}
      </div>
    );
  }
} // class Help

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCImport;
