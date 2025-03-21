/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Template Editor
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { Settings, ConsoleStyler } = require('ursys-min');
// const PopupPicker = require('./PopupPicker.jsx');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);
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
class MURSettingEditor extends UNISYS.Component {
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
    this.propDefs = {};
    this.handleSettingsUpdate = this.handleSettingsUpdate.bind(this);
  }

  /// REACT LIFECYCLE ///

  async componentDidMount() {
    Settings.Subscribe('*', this.handleSettingsUpdate);
    // props are sorted in order they are merged in mur-settings-mgr.mts
    const props = await Settings.Get('PropertyDefs');
    this.propDefs = props;
    if (DBG) LOG(...PR('propDefs', Object.keys(props).join(', ')));
  }

  componentWillUnmount() {
    Settings.Unsubscribe('*', this.handleSettingsUpdate);
  }

  /// DATA EVENT HANDLERS ///

  /** called after subscribing via Settings.Subscribe() */
  handleSettingsUpdate(data) {
    const { settings, group, prop } = data;
    console.log(Object.keys(settings).join(', '));
  }

  /// UI EVENT STATE AND EVENT HANDLERS ///

  setColor(evt) {
    console.log('setcolor called', evt);
  }

  /// RENDERED OUTPUT ///

  render() {
    return (
      <div>
        <ui-group group="nctest">
          <in-text name="foo"></in-text>
        </ui-group>
        <ui-metadata for="nctest">{UI_META}</ui-metadata>
      </div>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingEditor;
