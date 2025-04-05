/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ## OVERVIEW

  Provides tools to import and export node/edge data files.

  This also provides a "Force Unlock All" button that can be used by Admins
  to unlock all edit locks requested by node editors, edge editors, template
  editors, and importers on the network.

  This displays a subpanel on the "More..." tab.

  `importexport-mgr.js` (IMPORTEXPORT) handles all of the business logic for
  importing and exporting.  See that file for details.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const SETTINGS = require('settings');
const NetMessage = require('unisys/common-netmessage-class');

const UNISYS = require('unisys/client');
const DATASTORE = require('system/datastore');
const { EDITORTYPE } = require('system/util/enum');

const IMPORTEXPORT = require('../importexport-mgr');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'ImportExport';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NODEFILESTATUS_DEFAULT = 'Select a node .csv file to import';
const EDGEFILESTATUS_DEFAULT = 'Select an edge .csv file to import';

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class ImportExport extends UNISYS.Component {
  constructor(props) {
    super(props);
    const TEMPLATE = this.AppState('TEMPLATE');
    this.state = {
      isExpanded: true,
      preventImport: false, // an external source has disabled import for us
      importIsActive: false, // internal source: keeps track of whether THIS panel has valid import files selected
      nodefile: undefined,
      nodefileStatus: NODEFILESTATUS_DEFAULT,
      nodeValidationMsgs: undefined,
      nodeOkToImport: false,
      edgefile: undefined,
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
    this.onNodesExportSelect = this.onNodesExportSelect.bind(this);
    this.onEdgesExportSelect = this.onEdgesExportSelect.bind(this);
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
    this.updateEditState();
    window.addEventListener('beforeunload', this.checkUnload);
    window.addEventListener('unload', this.doUnload);
  }

  componentWillUnmount() {
    this.NetSend('SRV_RELEASE_EDIT_LOCK', { editor: EDITORTYPE.IMPORTER });
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
    if (!importIsActive) {
      const preventImport =
        LOCKSTATE.templateBeingEdited ||
        LOCKSTATE.importActive ||
        LOCKSTATE.nodeOrEdgeBeingEdited ||
        UNISYS.IsStandaloneMode();
      this.setState({ preventImport });
    }
  }

  updateEditState() {
    // disable edit if someone else is editing a template, node, or edge
    this.urstate_LOCKSTATE(this.AppState('LOCKSTATE'));
    // REVIEW: Reduce setState calls?
    DATASTORE.PromiseCalculateMaxNodeId().then(data => {
      this.setState({ nextNodeId: data + 1 });
    });
    DATASTORE.PromiseCalculateMaxEdgeId().then(data => {
      this.setState({ nextEdgeId: data + 1 });
    });
  }

  onNodesExportSelect() {
    IMPORTEXPORT.ExportNodes();
  }
  onEdgesExportSelect() {
    IMPORTEXPORT.ExportEdges();
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
    IMPORTEXPORT.Import().then(result => {
      this.setState({
        okToImport: false, // imported, so hide "Import" button
        nodeOkToImport: false,
        edgeOkToImport: false,
        importMsgs: result.messageJsx
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
      nodefile,
      nodefileStatus,
      edgefile,
      edgefileStatus,
      importMsgs,
      allowLoggedInUserToImport,
      nextNodeId,
      nextEdgeId,
      nodeValidationMsgs,
      edgeValidationMsgs,
      okToImport
    } = this.state;

    // Set Import Permissions
    // -- Admins can always import
    // -- If allowLoggedInUserToImport, logged in users can also import
    const ISADMIN = SETTINGS.IsAdmin();
    const isLoggedIn = NetMessage.GlobalGroupID();
    const importDisabled = !(ISADMIN || (allowLoggedInUserToImport && isLoggedIn));

    const importBtnDisabled = !okToImport;

    const exportjsx = (
      <div className="panel">
        <h1>Export Data</h1>
        <p className="system">Export data in .csv format.</p>
        <div className="buttonbar">
          <button className="small" type="button" onClick={this.onNodesExportSelect}>
            Export Nodes
          </button>
          <button className="small" type="button" onClick={this.onEdgesExportSelect}>
            Export Edges
          </button>
        </div>
      </div>
    );

    let importjsx;
    if (preventImport && !importIsActive) {
      importjsx = (
        <div className="panel">
          <p>
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
          <p>
            Importing data will <b>merge</b> the new nodes and edges into the existing
            nodes and edges.
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
          <label>
            <button
              className="small outline"
              type="button"
              onClick={this.clearFileSelect}
            >
              Clear File Selections
            </button>
          </label>
          <div>
            {nodeValidationMsgs && <p>{nodeValidationMsgs}</p>}
            {edgeValidationMsgs && <p>{edgeValidationMsgs}</p>}
            {importMsgs && <p>{importMsgs}</p>}
          </div>
          <button
            className={`small ${importBtnDisabled ? '' : 'cat'}`}
            type="button"
            disabled={importBtnDisabled}
            onClick={this.onDoImport}
          >
            Import
          </button>
        </div>
      );
    }

    let unlockAlljsx;
    if (ISADMIN) {
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
        {exportjsx}
        {importjsx}
        {unlockAlljsx}
      </div>
    );
  }
} // class Help

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = ImportExport;
