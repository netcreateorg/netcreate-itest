/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Template Editor
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.VIEWLIB.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { EDITORTYPE } = require('system/util/enum');
const TEMPLATE_MGR = require('../templateEditor-mgr');
const LOCKMGR = require('../lock-mgr');
const SCHEMA = require('../template-schema');
const DATASTORE = require('system/datastore');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UI_META = `
foo:
  label: "Notes OK"
  tooltip: >
    Notes for this node are very very long,
    so you shouldn't have to worry about anything
  placeholder: "type some notes"
color:
  label: "Color"
  tooltip: "Color of the node"
  placeholder: "#ff0000"
`;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MURTemplate extends UNISYS.Component {
  constructor(props) {
    super(props);
    // UNISYS.Component already has UDATA and exposes these handlers
    // this.HandleMessage
    // this.DropMessage
    // this.OnDOMReady
    // this.OnAppReady
    // this.OnDisconnect
    // this.Call, Send, Signal
    // this.AppCall, AppSend, AppSignal
    // this.NetCend, NetSend, NetSignal
    // this.SetAppState, OnAppStateChange, AppStatechangeOff
    this.colorRef = React.createRef();
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <div>
        <ui-group group="nctest">
          <in-text name="foo"></in-text>
          <in-coloris ref={this.colorRef} name="color"></in-coloris>
        </ui-group>
        <ui-metadata for="nctest">{UI_META}</ui-metadata>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURTemplate;
