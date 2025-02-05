/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    Prototype Simple NetCreate Edge Editor

    Built for Version 2.0 ITEST.

    Provides a viewer and editor for the currently selected edge.

    USAGE

      <NCNEdge edgeId={edgeId} parentNodeId={nodeId} key={e.id} />

    This is designed to be embedded in an <NCNode> object.
    There should only be one open NCEdge component at a time.

    PERMISSIONS
    Editting is restricted by:
    * User must be logged in
    * Template is not being edited
    * Data is not being imported
    * Someone else is not editing the edge (and has placed a lock on it)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { BUILTIN_FIELDS_EDGE } = require('system/util/enum');
const {
  EDGE_NOT_SET_LABEL,
  ARROW_DOWN,
  ARROW_UPDOWN,
  ARROW_RIGHT
} = require('system/util/constant');
const LOCKMGR = require('../lock-mgr');
const CMTMGR = require('../comment-mgr');
const NCLOGIC = require('../nc-logic');
const NCUI = require('../nc-ui');
const NCAutoSuggest = require('./NCAutoSuggest');
const NCDialog = require('./NCDialog');
const NCDialogCitation = require('./NCDialogCitation');
const SETTINGS = require('settings');
import URCommentVBtn from './URCommentVBtn';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = 'NCEdge';
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const isAdmin = SETTINGS.IsAdmin();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TABS = {
  // Also used as labels
  ATTRIBUTES: 'ATTRIBUTES',
  PROVENANCE: 'PROVENANCE'
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let UDATA;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export a class object for consumption by brunch/require
class NCEdge extends UNISYS.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoggedIn: false,
      animateHeight: 0
    }; // initialized on componentDidMount and clearSelection

    // STATE MANAGEMENT
    this.ResetState = this.ResetState.bind(this);
    this.urstate_SESSION = this.urstate_SESSION.bind(this);
    this.urstate_LOCKSTATE = this.urstate_LOCKSTATE.bind(this);
    this.urstate_NCDATA = this.urstate_NCDATA.bind(this);
    this.IsLoggedIn = this.IsLoggedIn.bind(this);
    this.DerivePermissions = this.DerivePermissions.bind(this);

    // EVENT HANDLERS
    this.CheckUnload = this.CheckUnload.bind(this);
    this.DoUnload = this.DoUnload.bind(this);
    this.ClearSelection = this.ClearSelection.bind(this);
    this.urstate_SELECTION = this.urstate_SELECTION.bind(this);
    this.ReqLoadEdge = this.ReqLoadEdge.bind(this);
    // DATA LOADING
    this.LoadEdge = this.LoadEdge.bind(this);
    this.DeleteEdge = this.DeleteEdge.bind(this);
    this.LoadAttributes = this.LoadAttributes.bind(this);
    this.LoadProvenance = this.LoadProvenance.bind(this);
    this.UnlockEdge = this.UnlockEdge.bind(this);
    this.EditEdge = this.EditEdge.bind(this);
    this.ValidateSourceTarget = this.ValidateSourceTarget.bind(this);
    this.OfferToCreateNewNode = this.OfferToCreateNewNode.bind(this);
    this.CreateNode = this.CreateNode.bind(this);
    this.BackToEditing = this.BackToEditing.bind(this);
    this.SetSourceTarget = this.SetSourceTarget.bind(this);
    this.ThenSaveSourceTarget = this.ThenSaveSourceTarget.bind(this);
    // DATA SAVING
    this.SaveEdge = this.SaveEdge.bind(this);
    // HELPER METHODS
    this.LookupBackgroundColor = this.LookupBackgroundColor.bind(this);
    this.LookupSourceTargetNodeColor = this.LookupSourceTargetNodeColor.bind(this);
    this.SwapSourceAndTarget = this.SwapSourceAndTarget.bind(this);
    this.EdgeDisplayName = this.EdgeDisplayName.bind(this);
    // UI MANIPULATION METHODS
    this.EnableEditMode = this.UIEnableEditMode.bind(this);
    // UI EVENT HANDLERS
    this.UISelectTab = this.UISelectTab.bind(this);
    this.UIRequestEditEdge = this.UIRequestEditEdge.bind(this);
    this.UIDeselectEdge = this.UIDeselectEdge.bind(this);
    this.UICancelEditMode = this.UICancelEditMode.bind(this);
    this.UIDisableEditMode = this.UIDisableEditMode.bind(this);
    this.UIDeleteEdge = this.UIDeleteEdge.bind(this);
    this.UIInputUpdate = this.UIInputUpdate.bind(this);
    this.UIProvenanceInputUpdate = this.UIProvenanceInputUpdate.bind(this);
    this.UIEnableSourceTargetSelect = this.UIEnableSourceTargetSelect.bind(this);
    this.UISourceTargetInputUpdate = this.UISourceTargetInputUpdate.bind(this);
    this.UISourceTargetInputSelect = this.UISourceTargetInputSelect.bind(this);
    this.UICitationShow = this.UICitationShow.bind(this);
    this.UICitationClose = this.UICitationClose.bind(this);
    // RENDERERS -- Main
    this.RenderView = this.RenderView.bind(this);
    this.RenderEdit = this.RenderEdit.bind(this);
    // FORM RENDERERS
    this.RenderSourceTargetButton = this.RenderSourceTargetButton.bind(this);

    /// Initialize UNISYS DATA LINK for REACT
    UDATA = UNISYS.NewDataLink(this);

    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    /// REGISTER LISTENERS
    UDATA.OnAppStateChange('SESSION', this.urstate_SESSION);
    UDATA.OnAppStateChange('NCDATA', this.urstate_NCDATA);
    UDATA.OnAppStateChange('SELECTION', this.urstate_SELECTION);
    UDATA.OnAppStateChange('LOCKSTATE', this.urstate_LOCKSTATE);
    UDATA.HandleMessage('EDGE_OPEN', this.ReqLoadEdge);
    UDATA.HandleMessage('EDGE_DESELECT', this.ClearSelection);
    UDATA.HandleMessage('EDGE_EDIT', this.EditEdge); // EdgeTable request
    UDATA.HandleMessage('SELECT_SOURCETARGET', this.SetSourceTarget);
  }

  componentDidMount() {
    this.ResetState(); // Initialize State

    const { edgeId } = this.props;
    const edge = UDATA.AppState('NCDATA').edges.find(e => e.id === edgeId);
    this.LoadEdge(edge);

    window.addEventListener('beforeunload', this.CheckUnload);
    window.addEventListener('unload', this.DoUnload);
  }
  componentWillUnmount() {
    UDATA.AppStateChangeOff('SESSION', this.urstate_SESSION);
    UDATA.AppStateChangeOff('NCDATA', this.urstate_NCDATA);
    UDATA.AppStateChangeOff('SELECTION', this.urstate_SELECTION);
    UDATA.AppStateChangeOff('LOCKSTATE', this.urstate_LOCKSTATE);
    UDATA.UnhandleMessage('EDGE_OPEN', this.ReqLoadEdge);
    UDATA.UnhandleMessage('EDGE_DESELECT', this.ClearSelection);
    UDATA.UnhandleMessage('EDGE_EDIT', this.EditEdge);
    UDATA.UnhandleMessage('SELECT_SOURCETARGET', this.SetSourceTarget);
    window.removeEventListener('beforeunload', this.CheckUnload);
    window.removeEventListener('unload', this.DoUnload);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// STATE MANAGEMENT
  ///
  ResetState() {
    this.setState({
      // EDGE DEFS 'core state data'
      id: null,
      // source: null, // avoid ambiguous keys, use sourceId instead
      // target: null, // avoid ambiguous keys, use targetId instead
      sourceId: null,
      targetId: null,
      type: '',
      attributes: {},
      provenance: {},
      created: undefined,
      updated: undefined,
      revision: 0,

      // SYSTEM STATE
      // isLoggedIn: false, // don't clear session state!
      // previousState: {},

      // UI State 'u'
      uEditBtnDisable: false,
      uEditBtnHide: false,
      uViewMode: NCUI.VIEWMODE.VIEW,
      uSelectedTab: TABS.ATTRIBUTES,
      uSelectSourceTarget: undefined,
      uBackgroundColor: '#ccc', // edge component bgcolor determined by type/COLORMAP
      uIsLockedByDB: false, // shows db lock message next to Edit Node button
      uIsLockedByTemplate: false,
      uIsLockedByImport: false,
      uEditLockMessage: '',
      uNewNodeKey: undefined,
      uNewNodeLabel: undefined,
      uShowCitationDialog: false,

      // DERIVED VALUES 'd'
      dSourceNode: undefined,
      dSourceNodeColor: null,
      dTargetNode: undefined,
      dTargetNodeColor: null
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SYSTEM/NETWORK EVENT HANDLERS
  ///
  CheckUnload(event) {
    event.preventDefault();
    if (this.state.uViewMode === NCUI.VIEWMODE.EDIT) {
      (event || window.event).returnValue = null;
    } else {
      Reflect.deleteProperty(event, 'returnValue');
    }
    return event;
  }
  DoUnload(event) {
    if (this.state.uViewMode === NCUI.VIEWMODE.EDIT) {
      LOCKMGR.RequestUnlockEdge(this.state.id);
    }
  }
  /**
   * Handle change in SESSION data
   * SESSION is called by SessionShell when the ID changes
   * set system-wide. data: { classId, projId, hashedId, groupId, isValid }
   * Called both by componentWillMount() and AppStateChange handler.
   * The 'SESSION' state change is triggered in two places in SessionShell during
   * its handleChange() when active typing is occuring, and also during
   * SessionShell.componentWillMount()
   */
  urstate_SESSION(decoded) {
    this.urstate_LOCKSTATE();
  }
  urstate_LOCKSTATE() {
    const permissionsState = this.DerivePermissions(this.state.id);
    this.setState({ ...permissionsState });
  }

  /*
      Called by NCDATA AppState updates
  */
  urstate_NCDATA(data) {
    // If NCDATA is updated, reload the edge b/c db has changed
    const updatedEdge = data.edges.find(e => e.id === this.props.edgeId);
    this.LoadEdge(updatedEdge);
  }
  /**
   * Checks current SESSION state to see if user is logged in.
   * Since NCEdge is dynamically created and closed, we can't rely on
   * SESSION AppState updates messages.
   * NOTE updates state.
   * @returns {boolean} True if user is logged in
   */
  IsLoggedIn() {
    const SESSION = UDATA.AppState('SESSION');
    const isLoggedIn = SESSION.isValid;
    return isLoggedIn;
  }

  // 1. Read the LOCKSTATE
  // 2. Derive the permissions state (hide/disable the edit button)
  // 3. Look up any lock messages
  DerivePermissions(edgeId) {
    const isLoggedIn = this.IsLoggedIn();

    const LOCKSTATE = UDATA.AppState('LOCKSTATE');
    const uIsLockedByDB = LOCKSTATE.lockedEdges.includes(edgeId);
    const uIsLockedByTemplate = LOCKSTATE.templateBeingEdited;
    const uIsLockedByImport = LOCKSTATE.importActive;
    // NOT IMPLEMENTED
    // FUTURE: We may want to lock the edge if a comment is being edited
    //         but currently there isn't an easy way to do this
    //         because while we know that a comment is being edited (via LOCKSTATE.lockedComments)
    //         we don't know if the comment is being edited by the current user or someone else.
    //         So for now, we allow the edge to be edited while a comment is being edited.
    //         If we wanted to implement this, we probably need to introduce a new parameter
    //         or properly implement commentBeingEditedByMe.
    // const uIsLockedByComment = LOCKSTATE.commentBeingEditedByMe;

    // Derive new message and EditBtn status
    let uEditLockMessage = '';
    let uEditBtnDisable = false;
    let uEditBtnHide = true;
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    if (isLoggedIn) uEditBtnHide = false;
    if (uIsLockedByDB) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.edgeIsLockedMessage;
    }
    if (uIsLockedByTemplate) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.templateIsLockedMessage;
    }
    if (uIsLockedByImport) {
      uEditBtnDisable = true;
      uEditLockMessage += TEMPLATE.importIsLockedMessage;
    }
    // NOT IMPLEMENTED
    // if (uIsLockedByComment) {
    //   uEditBtnDisable = true;
    //   // no change to lock message for comments
    // }

    // return all state values
    return {
      // User Permissions
      isLoggedIn,
      uIsLockedByDB,
      uIsLockedByTemplate,
      uIsLockedByImport,
      // uIsLockedByComment, // NOT IMPLEMENTED
      // UI State
      uEditBtnDisable,
      uEditBtnHide,
      uEditLockMessage
    };
  }

  ClearSelection() {
    this.ResetState();
  }
  urstate_SELECTION(data) {
    const { sourceTargetSelect } = this.state;
    const selectedNode = data.nodes[0]; // select the first node
    if (sourceTargetSelect === 'source') {
      this.setState({
        sourceId: selectedNode.id,
        dSourceNode: selectedNode
      });
    } else if (sourceTargetSelect === 'target') {
      this.setState({
        targetId: selectedNode.id,
        dTargetNode: selectedNode
      });
    } else {
      // ignore the selection
    }
  }
  ReqLoadEdge(data) {
    // handler for UDATA call, interprets the net `data`
    this.LoadEdge(data.edge);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA LOADING
  ///
  LoadEdge(edge) {
    const { uViewMode } = this.state;

    // If we're editing, ignore the select!
    if (uViewMode === NCUI.VIEWMODE.EDIT) return;

    // If no edge was selected, deselect
    if (!edge) {
      this.ClearSelection();
      return;
    }

    // Load the edge
    //  - Look up source/target nodes
    //  - convert edge.source/target to sourceId/targetId to disambiguate id vs object
    const sourceId = edge.source;
    const targetId = edge.target;
    const NCDATA = UDATA.AppState('NCDATA');
    const dSourceNode = NCDATA.nodes.find(n => n.id === sourceId) || {
      label: ''
    };
    const dTargetNode = NCDATA.nodes.find(n => n.id === targetId) || {
      label: ''
    };
    const { dSourceNodeColor, dTargetNodeColor } = this.LookupSourceTargetNodeColor();
    //  - Load attributes and provenance
    const attributes = this.LoadAttributes(edge);
    const provenance = this.LoadProvenance(edge);
    //  - Load derived values
    const uBackgroundColor = this.LookupBackgroundColor(edge.type);
    const permissionsState = this.DerivePermissions(edge.id);

    this.setState({
      id: edge.id,
      sourceId: sourceId,
      targetId: targetId,
      type: edge.type,
      attributes: attributes,
      provenance: provenance,
      created: edge.meta ? new Date(edge.meta.created).toLocaleString() : '',
      createdBy: edge.createdBy,
      updated: edge.meta ? new Date(edge.meta.updated).toLocaleString() : '',
      updatedBy: edge.updatedBy,
      revision: edge.meta ? edge.meta.revision : '',
      // Derived Values
      dSourceNode,
      dTargetNode,
      dSourceNodeColor,
      dTargetNodeColor,
      // UI parameters
      uBackgroundColor,
      animateHeight: 'fullheight',
      ...permissionsState
    });
  }
  /**
   * Loads up the `attributes` object defined by the TEMPLATE
   * Will skip
   *   * BUILTIN fields
   *   * attributes that are `hidden` by the template
   * REVIEW: Currently the parameters will show up in random object order.
   * @param {Object} edge
   * @returns {Object} { ...attr-key: attr-value }
   */
  LoadAttributes(edge) {
    const EDGEDEFS = UDATA.AppState('TEMPLATE').edgeDefs;
    const attributes = {};
    Object.keys(EDGEDEFS).forEach(k => {
      if (BUILTIN_FIELDS_EDGE.includes(k)) return; // skip built-in fields
      const attr_def = EDGEDEFS[k];
      if (attr_def.hidden) return; // skip hidden fields
      if (attr_def.isProvenance) return; // skip fields that are marked as provenance
      attributes[k] = edge[k];
    });
    return attributes;
  }
  /**
   * Loads up the `provenance` object defined by the TEMPLATE
   * Will skip
   *   * BUILTIN fields
   *   * attributes that are `hidden` by the template
   * REVIEW: Currently the parameters will show up in random object order.
   * @param {Object} edge
   * @returns {Object} { ...attr-key: attr-value }
   */
  LoadProvenance(edge) {
    const EDGEDEFS = UDATA.AppState('TEMPLATE').edgeDefs;
    const provenance = {};
    Object.keys(EDGEDEFS).forEach(k => {
      if (BUILTIN_FIELDS_EDGE.includes(k)) return; // skip built-in fields
      const provenance_def = EDGEDEFS[k];
      if (provenance_def.hidden) return; // skip hidden fields
      if (!provenance_def.isProvenance) return; // skip fields that are not marked as provenance
      provenance[k] = edge[k];
    });
    return provenance;
  }

  /**
   * Returns whether the unlock is successful
   * @param {function} cb Callback function to handle cleanup after unlock
   */
  UnlockEdge(cb) {
    LOCKMGR.RequestUnlockEdge(this.state.id, cb);
  }

  /**
   * If `lockEdge` is not successful, then that means the edge was
   * already locked, so we can't edit.
   */
  EditEdge() {
    const { isLoggedIn } = this.state;
    if (!isLoggedIn) return;
    LOCKMGR.RequestLockEdge(this.state.id, lockSuccess => {
      this.setState({ uIsLockedByDB: !lockSuccess }, () => {
        if (lockSuccess) this.UIEnableEditMode();
      });
    });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// SET SOURCE / TARGET
  ///
  /// Selecting a source or target node is a multi-step process.
  /// 1. First, you need to Enable editing
  /// 2. Then, you need to click on a Source or Target node to activate
  ///    the source or target for selection
  /// 3. Once you enable source or target editing, you need to decide
  ///    how you want to select the node...
  ///    A. Click on the node on the d3 graph to select the node, or...
  ///    B. Type the full node name, or...
  ///    C. Type a partial name, and..
  ///       and arrow up/down to highlight
  ///       and hit Enter to select
  ///       or click name to select
  ///    D. Type a new node name and
  ///       and hit Enter to add a new node
  ///       and show dialog confirm creating a new node
  /// 5. Click "Save" to exit edit mode
  ///
  /**
   * User has selected a new source or target
   * validate it to make sure it exists
   * if it doesn't, offer to create a new one
   * Uses either `id` or `value` to find the node
   *
   * @param {string} key 'source' or 'target'
   * @param {string} label
   * @param {number} id
   */
  ValidateSourceTarget(key, label, id) {
    // if we have an id, then the selected source/target is an existing node
    // but we should probably validate it anyway?
    let keyType, searchString;
    if (id) {
      // find node by 'id'
      keyType = 'id';
      searchString = id;
    } else {
      // find node by 'label'
      keyType = 'label';
      searchString = label;
    }
    UDATA.LocalCall('FIND_NODE_BY_PROP', {
      key: keyType,
      searchString
    }).then(data => {
      if (data.nodes.length > 0) {
        const node = data.nodes[0];
        this.ThenSaveSourceTarget(key, node);
      } else {
        this.OfferToCreateNewNode(key, label);
      }
    });
  }
  /**
   * User has input a new node name that doesn't match an existing node
   * so offer to create a new node
   * @param {string} key 'source' or 'target'
   * @param {string} value
   */
  OfferToCreateNewNode(key, value) {
    this.setState({
      uNewNodeKey: key,
      uNewNodeLabel: value
    });
  }
  /**
   * NCDialog offer to create a new node -- user decided to create a new
   * new node, so add it.
   */
  CreateNode() {
    const { uNewNodeKey, uNewNodeLabel } = this.state;
    UDATA.LocalCall('NODE_CREATE', { label: uNewNodeLabel }).then(node => {
      this.setState({ uNewNodeKey: undefined, uNewNodeLabel: undefined }, () =>
        this.ThenSaveSourceTarget(uNewNodeKey, node)
      );
    });
  }
  /**
   * NCDialog offer to create a new node -- user clicked Cancel so
   * go back to editing the node
   */
  BackToEditing() {
    this.setState({ uNewNodeKey: undefined, uNewNodeLabel: undefined });
  }
  /**
   * User has selected a source or target node by clicking on D3 graph
   * Called by Selection Manager via SELECT_SOURCETARGET
   * @param {Object} data
   * @param {Object} data.node
   */
  SetSourceTarget(data) {
    const { uSelectSourceTarget } = this.state;

    // The source/target has been set already, so return to edge edit mode
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'edge_edit' });

    // Clear the secondary selection
    UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');

    this.ThenSaveSourceTarget(uSelectSourceTarget, data.node);
  }
  /**
   * Save the source or target after either creating new node or selecting
   * an existing ndoe.
   * Runs after validateSourceTarget
   * @param {string} key 'source' or 'target'
   * @param {Object} node {id, label}
   */
  ThenSaveSourceTarget(key, node) {
    // MUST save sourceId or targetId to determine source/target
    // but ideally set all three?  because that's what loadEdge does?
    const state = {
      uSelectSourceTarget: undefined,
      uNewNodeKey: undefined, // clear NCDialog
      uNewNodeLabel: undefined // clear NCDialog
    };
    const NCDATA = UDATA.AppState('NCDATA');
    if (key === 'source') {
      state.sourceId = node.id;
      state.dSourceNode = NCDATA.nodes.find(n => n.id === node.id) || {
        label: ''
      };
    } else {
      // 'target'
      state.targetId = node.id;
      state.dTargetNode = NCDATA.nodes.find(n => n.id === node.id) || {
        label: ''
      };
    }

    // show secondary selection
    UDATA.LocalCall('SELECTMGR_SELECT_SECONDARY', { node });
    this.setState(state);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DATA SAVING
  ///
  SaveEdge() {
    const { id, sourceId, targetId, type, attributes, provenance } = this.state;
    const uid = NCLOGIC.GetCurrentUserId();
    const edge = {
      id,
      source: sourceId,
      target: targetId,
      type,
      updatedBy: uid
    };
    Object.keys(attributes).forEach(k => (edge[k] = attributes[k]));
    Object.keys(provenance).forEach(k => (edge[k] = provenance[k]));

    this.setState(
      {
        uViewMode: NCUI.VIEWMODE.VIEW
      },
      () => {
        this.AppCall('DB_UPDATE', { edge }).then(() => {
          this.UnlockEdge(() => {
            // Clear the secondary selection
            UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');

            UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'normal' });
            this.setState({
              uIsLockedByDB: false,
              uSelectSourceTarget: undefined
            });
          });
        });
      }
    );
    UNISYS.Log('click save edge', id, this.EdgeDisplayName(), JSON.stringify(edge));
  }
  DeleteEdge() {
    const { id } = this.state;
    this.AppCall('DB_UPDATE', { edgeID: id }); // Calling DB_UPDATE with `edgeID` will remove the edge
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HELPER METHODS
  ///
  /**
   * Sets the background color of the node editor via `uBackgroundColor` state.
   * Currently the background color is determined by the template edge type
   * color mapping.  This will eventually be replaced with a color manager.
   */
  LookupBackgroundColor(type) {
    const COLORMAP = UDATA.AppState('COLORMAP');
    const uBackgroundColor = COLORMAP.edgeColorMap[type] || '#555555';
    return uBackgroundColor;
  }
  LookupSourceTargetNodeColor({ dSourceNode, dTargetNode } = this.state) {
    const COLORMAP = UDATA.AppState('COLORMAP');
    const dSourceNodeColor =
      COLORMAP.nodeColorMap[dSourceNode ? dSourceNode.type : ''];
    const dTargetNodeColor =
      COLORMAP.nodeColorMap[dTargetNode ? dTargetNode.type : ''];
    return { dSourceNodeColor, dTargetNodeColor };
  }
  SwapSourceAndTarget() {
    const {
      sourceId,
      dSourceNode,
      dSourceNodeColor,
      targetId,
      dTargetNode,
      dTargetNodeColor
    } = this.state;

    // swap
    const swappedTargetId = sourceId;
    const swappedSourceId = targetId;
    const swappedTargetNode = dSourceNode;
    const swappedSourceNode = dTargetNode;
    const swappedTargetNodeColor = dSourceNodeColor;
    const swappedSourceNodeColor = dTargetNodeColor;

    this.setState({
      sourceId: swappedSourceId,
      dSourceNode: swappedSourceNode,
      dSourceNodeColor: swappedSourceNodeColor,
      targetId: swappedTargetId,
      dTargetNode: swappedTargetNode,
      dTargetNodeColor: swappedTargetNodeColor
    });
  }
  EdgeDisplayName() {
    const { dSourceNode, dTargetNode } = this.state;
    return `${dSourceNode.label}${ARROW_RIGHT}${dTargetNode.label}`;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI MANIPULATION METHODS
  ///
  /**
   * Save `previousState` so that we can undo/restore data if user cancels
   */
  UIEnableEditMode() {
    const { uSelectedTab, id, sourceId, targetId, type, attributes, provenance } =
      this.state;
    const previousState = {
      sourceId,
      targetId,
      type,
      attributes: Object.assign({}, attributes),
      provenance: Object.assign({}, provenance)
    };
    this.setState({
      uViewMode: NCUI.VIEWMODE.EDIT,
      uSelectedTab,
      previousState
    });
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'edge_edit' });

    const edge = {
      id,
      source: sourceId,
      target: targetId,
      type,
      provenance
    };
    Object.keys(attributes).forEach(k => (edge[k] = attributes[k]));
    Object.keys(provenance).forEach(k => (edge[k] = provenance[k]));
    UNISYS.Log('edit edge', id, this.EdgeDisplayName(), JSON.stringify(edge));
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// UI EVENT HANDLERS
  ///
  UISelectTab(event) {
    event.stopPropagation();
    const { id } = this.state;
    this.setState({ uSelectedTab: event.target.value });
    UNISYS.Log('select edge tab', id, this.EdgeDisplayName(), event.target.value);
  }

  UIRequestEditEdge(event) {
    event.stopPropagation();
    this.EditEdge();
  }

  UIDeselectEdge() {
    UDATA.LocalCall('EDGE_DESELECT');
  }

  UICancelEditMode() {
    const { id, revision, previousState } = this.state;
    // if user is cancelling a newly created unsaved edge, delete the edge instead
    if (revision < 1) {
      this.UIDisableEditMode();
      this.DeleteEdge();
      return;
    }

    // restore previous state
    this.setState(
      {
        sourceId: previousState.sourceId,
        targetId: previousState.targetId,
        type: previousState.type,
        attributes: previousState.attributes,
        provenance: previousState.provenance,
        uSelectSourceTarget: undefined
      },
      () => this.UIDisableEditMode()
    );
    UNISYS.Log('cancel edit edge', id, this.EdgeDisplayName());
  }

  UIDisableEditMode() {
    this.UnlockEdge(() => {
      this.setState({
        uViewMode: NCUI.VIEWMODE.VIEW
      });

      // Clear the secondary selection
      UDATA.LocalCall('SELECTMGR_DESELECT_SECONDARY');
      UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'normal' });
    });
  }

  UIDeleteEdge() {
    this.UIDisableEditMode();
    this.DeleteEdge();
  }

  UIInputUpdate(key, value) {
    if (BUILTIN_FIELDS_EDGE.includes(key)) {
      const data = {};
      data[key] = value;
      this.setState(data, () => this.LookupBackgroundColor());
    } else {
      const { attributes } = this.state;
      attributes[key] = value;

      // special handling to update the background color immediately if `type` is changed
      const type = key === `type` ? value : this.state.type;
      const uBackgroundColor = this.LookupBackgroundColor(type);
      this.setState({ attributes, uBackgroundColor });
    }
  }
  UIProvenanceInputUpdate(key, value) {
    if (BUILTIN_FIELDS_EDGE.includes(key)) {
      const data = {};
      data[key] = value;
      this.setState(data);
    } else {
      const { provenance } = this.state;
      provenance[key] = value;
      this.setState({ provenance });
    }
  }

  UIEnableSourceTargetSelect(event) {
    const key = event.target.id;
    this.setState({ uSelectSourceTarget: key });
    UDATA.LocalCall('SELECTMGR_SET_MODE', { mode: 'sourcetarget' });
  }

  /**
   * Handles keystrokes as user inputs new node in form
   * @param {string} key
   * @param {string} value
   */
  UISourceTargetInputUpdate(key, value) {
    const updatedState = {};
    if (key === 'source') {
      updatedState.dSourceNode = { label: value };
    } else {
      updatedState.dTargetNode = { label: value };
    }
    this.setState(updatedState);
  }

  /**
   * User has selected a node with NCAutoSuggest, either
   * - Clicking on a suggested node
   * - Hitting Enter with the form field showing either a valid node or a new node
   * @param {string} key is 'id' or 'label'
   * @param {string} label
   * @param {number} id
   */
  UISourceTargetInputSelect(key, label, id) {
    this.ValidateSourceTarget(key, label, id);
  }

  UICitationShow(event) {
    event.stopPropagation();
    this.setState({ uShowCitationDialog: true });
  }
  UICitationClose() {
    this.setState({ uShowCitationDialog: false });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// RENDER METHODS
  RenderView() {
    const {
      uSelectedTab,
      uBackgroundColor,
      animateHeight,
      uEditBtnDisable,
      uEditBtnHide,
      uEditLockMessage,
      uShowCitationDialog,
      id,
      dSourceNode = { label: undefined },
      dTargetNode = { label: undefined },
      type
    } = this.state;
    const bgcolor = uBackgroundColor + '66'; // hack opacity
    const TEMPLATE = UDATA.AppState('TEMPLATE');
    const defs = TEMPLATE.edgeDefs;
    const uShowCitationButton = TEMPLATE.citation && !TEMPLATE.citation.hidden;
    const disableSourceTargetInView = true;
    const citation =
      `NetCreate ${TEMPLATE.name} network, ` +
      `Edge: (ID ${id}), ` +
      `from "${dSourceNode.label}" to "${dTargetNode.label}". ` +
      (TEMPLATE.citation && TEMPLATE.citation.text
        ? `${TEMPLATE.citation.text}. `
        : '') +
      `Last accessed at ${NCUI.DateFormatted()}.`;
    const collection_ref = CMTMGR.GetEdgeCREF(id);

    return (
      <div className={`nccomponent ncedge ${animateHeight}`}>
        <div
          className="view"
          style={{ backgroundColor: bgcolor }}
          onClick={this.UIDeselectEdge}
        >
          {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
          <div className="titlebar" style={{ marginBottom: '3px' }}>
            <div className="nodenumber">EDGE {id} </div>
            <div></div>
            <URCommentVBtn cref={collection_ref} key={collection_ref} />
          </div>
          <div className="formview">
            {NCUI.RenderLabel('source', defs['source'].displayLabel)}
            {this.RenderSourceTargetButton(
              'source',
              dSourceNode.label,
              disableSourceTargetInView
            )}
            <div />
            <div className="edgetypeRow">
              <div className="targetarrow">{ARROW_DOWN}</div>
              {/* Special handling for `type` field */}
              {defs['type'] && !defs['type'].hidden ? (
                <div className="formview typeview">
                  {NCUI.RenderLabel(
                    'type',
                    defs['type'].displayLabel,
                    defs['type'].help
                  )}
                  {NCUI.RenderStringValue('type', type)}
                </div>
              ) : (
                <div />
              )}
            </div>
            {NCUI.RenderLabel('target', defs['target'].displayLabel)}
            {this.RenderSourceTargetButton(
              'target',
              dTargetNode.label,
              disableSourceTargetInView
            )}
          </div>
          {/* TABS - - - - - - - - - - - - - - - - - - - */}
          <div className="tabcontainer">
            {NCUI.RenderTabSelectors(TABS, this.state, this.UISelectTab)}
            <div className="tabview">
              {uSelectedTab === TABS.ATTRIBUTES &&
                NCUI.RenderAttributesTabView(this.state, defs)}
              {uSelectedTab === TABS.PROVENANCE &&
                NCUI.RenderProvenanceTabView(this.state, defs)}
            </div>
          </div>
          {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
          <div className="controlbar">
            {uShowCitationButton && (
              <button
                id="citationbtn"
                className="citationbutton"
                onClick={this.UICitationShow}
              >
                Cite Edge
              </button>
            )}
            <div style={{ flexGrow: 1 }}></div>
            {!uEditBtnHide && uSelectedTab !== TABS.EDGES && (
              <button
                id="editbtn"
                onClick={this.UIRequestEditEdge}
                disabled={uEditBtnDisable}
              >
                Edit
              </button>
            )}
          </div>
          {!uEditBtnHide && uEditLockMessage && (
            <div className="message warning" style={{ marginTop: '1em' }}>
              <p>{uEditLockMessage}</p>
              <p hidden={!isAdmin}>
                <b>ADMINISTRATOR ONLY</b>: If you are absolutely sure this is an
                error, you can force the unlock.
                <button onClick={this.UIDisableEditMode} style={{ marginLeft: 0 }}>
                  Force Unlock
                </button>
              </p>
            </div>
          )}
        </div>
        {uShowCitationDialog && (
          <NCDialogCitation message={citation} onClose={this.UICitationClose} />
        )}
      </div>
    );
  }

  RenderEdit() {
    const { parentNodeId } = this.props;
    const {
      sourceId,
      targetId,
      type,
      revision,
      uSelectedTab,
      uSelectSourceTarget,
      uBackgroundColor,
      uNewNodeLabel,
      animateHeight,
      dSourceNode,
      dTargetNode
    } = this.state;
    const bgcolor = uBackgroundColor + '99'; // hack opacity
    const defs = UDATA.AppState('TEMPLATE').edgeDefs;
    const AskNodeDialog = uNewNodeLabel ? (
      <NCDialog
        message={`Node "${uNewNodeLabel}" does not exist.  Do you want to create it?`}
        okmessage={`Create "${uNewNodeLabel}" node`}
        onOK={this.CreateNode}
        cancelmessage="Back to Edge Edit"
        onCancel={this.BackToEditing}
      />
    ) : (
      ''
    );
    const saveIsDisabled = uSelectSourceTarget || isNaN(sourceId) || isNaN(targetId);
    return (
      <div>
        <div className="screen"></div>
        <div className={`nccomponent ncedge ${animateHeight}`}>
          <div
            className="edit"
            style={{
              background: bgcolor,
              borderColor: uBackgroundColor
            }}
          >
            {/* BUILT-IN - - - - - - - - - - - - - - - - - */}
            <div className="formview">
              {NCUI.RenderLabel('source', defs['source'].displayLabel)}
              {this.RenderSourceTargetButton(
                'source',
                dSourceNode.label,
                parentNodeId === sourceId
              )}
              <div />
              <div className="edgetypeRow">
                <div className="targetarrow">
                  <button
                    className="swapbtn"
                    onClick={this.SwapSourceAndTarget}
                    title="Swap 'Source' and 'Target' nodes"
                  >
                    {ARROW_UPDOWN}
                  </button>
                </div>
                {/* Special handling for `type` field */}
                {defs['type'] && !defs['type'].hidden && (
                  <div className="formview typeview">
                    {NCUI.RenderLabel(
                      'type',
                      defs['type'].displayLabel,
                      defs['type'].help
                    )}
                    {NCUI.RenderOptionsInput(
                      'type',
                      type,
                      defs,
                      this.UIInputUpdate,
                      defs['type'].help
                    )}
                  </div>
                )}
              </div>
              {NCUI.RenderLabel('target', defs['target'].displayLabel)}
              {this.RenderSourceTargetButton(
                'target',
                dTargetNode.label,
                parentNodeId === targetId
              )}
            </div>
            {/* TABS - - - - - - - - - - - - - - - - - - - */}
            <div className="tabcontainer">
              {NCUI.RenderTabSelectors(TABS, this.state, this.UISelectTab)}
              <div className="tabview">
                {uSelectedTab === TABS.ATTRIBUTES &&
                  NCUI.RenderAttributesTabEdit(this.state, defs, this.UIInputUpdate)}
                {uSelectedTab === TABS.PROVENANCE &&
                  NCUI.RenderProvenanceTabEdit(
                    this.state,
                    defs,
                    this.UIProvenanceInputUpdate
                  )}
              </div>
            </div>
            {/* CONTROL BAR - - - - - - - - - - - - - - - - */}
            <div className="controlbar" style={{ justifyContent: 'space-between' }}>
              {revision > 0 && (
                <button className="cancelbtn" onClick={this.UIDeleteEdge}>
                  Delete
                </button>
              )}
              <button className="cancelbtn" onClick={this.UICancelEditMode}>
                Cancel
              </button>
              <button onClick={this.SaveEdge} disabled={saveIsDisabled}>
                Save
              </button>
            </div>
          </div>
        </div>
        {AskNodeDialog}
      </div>
    );
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// FORM RENDERERS
  ///

  /**
   * The Source and Target Buttons are used for
   * - Displaying the source / target name in the view/edit panel
   * - Click on Source or Target to select a new one
   * - Showing a focus ring (outline) after having secondarily selected a source/target
   * @param {string} key 'source' or 'target'
   * @param {string} value
   * @param {boolean} disabled Used by renderView to disable source/target selection buttons
   *                           when it isn't being edited
   * @returns {jsx}
   */
  RenderSourceTargetButton(key, value, disabled) {
    const {
      sourceId,
      targetId,
      uSelectSourceTarget,
      dSourceNodeColor,
      dTargetNodeColor
    } = this.state;
    let color;
    if (!disabled && (uSelectSourceTarget === key || value === undefined)) {
      return (
        <NCAutoSuggest
          parentKey={key}
          value={value}
          onChange={this.UISourceTargetInputUpdate}
          onSelect={this.UISourceTargetInputSelect}
        />
      );
    } else {
      color = key === 'source' ? dSourceNodeColor : dTargetNodeColor;
      // Secondary selection?
      const SELECTION = UDATA.AppState('SELECTION');
      let isSecondarySelection = false;
      if (key === 'source') {
        isSecondarySelection = SELECTION.selectedSecondary === sourceId;
      } else {
        // key === 'target'
        isSecondarySelection = SELECTION.selectedSecondary === targetId;
      }
      const selected = isSecondarySelection ? 'selected' : '';
      return (
        <div>
          <button
            id={key}
            key={`${key}value`}
            className={`sourcetargetbtn ${selected}`}
            onClick={this.UIEnableSourceTargetSelect}
            style={{ backgroundColor: color + '55', borderColor: color }}
            disabled={disabled}
          >
            {value || EDGE_NOT_SET_LABEL}
          </button>
        </div>
      );
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// MAIN RENDER
  ///
  render() {
    const { id, uViewMode } = this.state;
    if (!id) return ''; // nothing selected
    if (uViewMode === NCUI.VIEWMODE.VIEW) {
      return this.RenderView();
    } else {
      return this.RenderEdit();
    }
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = NCEdge;
