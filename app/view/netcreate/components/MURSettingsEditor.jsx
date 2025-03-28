/* eslint-disable no-alert */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Panel
  (test replacement `NCTemplate.jsx`)

  Requires that init.jsx has called UR.ViewLib.DeclareComponents() to make
  custom web components available _before_ React renders anything.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const React = require('react');
const UNISYS = require('unisys/client');
const { Settings, ConsoleStyler, DataNorm } = require('ursys-min');
const {
  GetPropertyDefs,
  FlattenPropertyDefs,
  GetMetaDefs,
  GetStyles,
  OnValueChanged,
  OffValueChanged
} = require('./react-settings-bridge');
const PropertyGroup = require('./MURPropertyGroup');

/// RUNTIME INITIALIZATION ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const PR = ConsoleStyler('SetEdit', 'TagBlue');
const LOG = console.log.bind(console);

/// FUNCTIONAL COMPONENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a settings ui for rendering inside a React component */
function GeneratePropList() {
  const props = GetPropertyDefs();
  const metadata = GetMetaDefs();
  const groupUI = [];
  Object.keys(props).forEach(gn => {
    groupUI.push(
      <PropertyGroup
        groupDef={{ [gn]: props[gn] }}
        metadata={{ [gn]: metadata[gn] }}
        key={KH('GRP')}
      />
    );
  });
  return groupUI;
}

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MURSettingEditor extends UNISYS.Component {
  constructor(props) {
    super(props);
    // UNISYS.Component already has UDATA and exposes these handlers
    // see client-react-component.jsx for more info
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
    const propsUI = GeneratePropList();
    return <div>{propsUI}</div>;
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = MURSettingEditor;
