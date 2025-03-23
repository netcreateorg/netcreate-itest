/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Editor Manager
  used by `MURSettingEditor.jsx` to generate components that are also linked
  to MUR. B

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const { Settings, ConsoleStyler } = require('ursys-min');
const UNISYS = require('unisys/client');

/// RUNTIME UNISYS HOOKS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LOG = console.log.bind(console);
const PR = ConsoleStyler('PropMgr', 'TagBlue');
const DBG = true;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_props = {}; // property definitions
let m_types = {}; // type definitions
let m_layouts = {}; // ui layout definitions
let m_values = {}; // value settings
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UNISYS.Hook('LOADASSETS', async () => {
  if (Object.keys(m_props).length > 0) return m_props;
  const { PropertyDefs, TypeDefs, LayoutDefs, ...values } = await Settings.Get();
  m_props = PropertyDefs;
  m_types = TypeDefs;
  m_layouts = LayoutDefs;
  m_values = values;
  if (DBG) LOG(...PR('propDefs:', Object.keys(m_props).join(', ')));
  if (DBG) LOG(...PR('typeDefs:', Object.keys(m_types).join(', ')));
  if (DBG) LOG(...PR('layoutDefs:', Object.keys(m_layouts).join(', ')));
});

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
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

/// STYLING OBJECTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const itemStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  margin: '0.25rem'
};
const labelStyle = { paddingRight: '0.5rem' };
const inputStyle = { border: '1px solid #cc8' };
const ttStyle = {
  position: 'fixed',
  backgroundColor: 'gray',
  color: 'white',
  padding: '5px',
  zIndex: 1000,
  maxWidth: '250px',
  display: 'none'
};

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let reactKeyHack = 0;
function KK(prefix) {
  if (typeof prefix !== 'string') prefix = Math.random().toString(36).substring(2, 5);
  return `${prefix}${reactKeyHack++}`;
}

/// ELEMENTS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TextInput(name, layoutDef) {
  if (typeof name !== 'string') return <p>getTextInput bad layoutDef</p>;
  if (typeof layoutDef !== 'object') return <p>getTextInput bad layoutDef</p>;
  return (
    <div key={KK('TI')} style={itemStyle}>
      <label htmlFor="{name}" style={labelStyle}>
        {name}
      </label>
      <input type="text" name="${name}" style={inputStyle} />
      <div style={ttStyle}></div>
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(groupName) {
  return (
    <span key={KK('GN')}>
      <b>{groupName}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PropertyGroup(groupName) {
  if (typeof groupName !== 'string') return <p>getPropertyGroup bad groupName</p>;
  const groupProps = m_props[groupName];
  if (!groupProps) return <p>getPropertyGroup no groupProps</p>;
  const propsUI = [];
  Object.entries(groupProps).forEach(([prop, def]) => {
    const layoutDef = GetLayoutMedata(groupName);
    console.log(layoutDef);
    if (def.type) propsUI.push(TextInput(prop, { ...def, ...layoutDef }));
  });
  return (
    <div key={KK('PG')} style={{ margin: '1rem' }}>
      <details open>
        <summary>{GroupHeader(groupName)}</summary>
        <ui-group key={KK('GP')} group={groupName}>
          {propsUI}
        </ui-group>
      </details>
    </div>
  );
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a settings ui for rendering inside a React component */
function RenderSettingsUI() {
  const groupUI = [];
  Object.keys(m_props).forEach(gn => {
    const propsUI = PropertyGroup(gn);
    groupUI.push(propsUI);
  });
  return groupUI;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return layout metadata for a given groupName or all */
function GetLayoutMedata(groupName) {
  if (groupName === undefined) return { ...m_layouts };
  if (typeof groupName !== 'string') return { error: `groupName must be string` };
  return m_layouts[groupName] || { error: `no such groupName ${groupName}` };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // components
  PropertyGroup,
  GroupHeader,
  TextInput,
  // API
  RenderSettingsUI,
  GetLayoutMedata
};
