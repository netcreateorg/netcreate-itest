/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { Settings, ConsoleStyler } = require('ursys-min');
const { RenderSettingsUI } = require('./mur-settings-client');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);

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
    this.handleSettingsUpdate = this.handleSettingsUpdate.bind(this);
  }

  /// REACT LIFECYCLE ///

  async componentDidMount() {
    Settings.Subscribe('*', this.handleSettingsUpdate);
    // props are sorted in order they are merged in mur-settings-mgr.mts
  }

  componentWillUnmount() {
    Settings.Unsubscribe('*', this.handleSettingsUpdate);
  }

  /// DATA EVENT HANDLERS ///

  /** called after subscribing via Settings.Subscribe() */
  handleSettingsUpdate(data) {
    const { settings, group, prop } = data;
  }

  /// RENDERED OUTPUT ///

  render() {
    return <div>{RenderSettingsUI()}</div>;
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingEditor;
