/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { RLK, DerefPropertyList } = RSB;
import TextInput from './MURTextInput';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { label } = props;
  return (
    <span key={RLK('GN')}>
      <b>{label}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PropertyGroup(props) {
  const {
    group, // { groupname: { propname: { type, default }, {}... }
    metadata // { groupname:{ propname: { _groupMeta, propname: metadata, {}... } }
  } = props;
  if (DBG) {
    if (typeof group !== 'object') return <p>PropertyGroup bad groupDef</p>;
    if (typeof metadata !== 'object') return <p>PropertyGroup bad metadata</p>;
  }
  const gdata = DerefPropertyList(group);
  if (gdata.error) return <p>PropertyGroup bad groupDef {gdata.error}</p>;
  const { groupName, properties } = gdata;
  const meta = metadata[groupName];
  const propsUI = [];
  const propList = Object.keys(properties);
  propList.forEach(p => {
    if (properties[p].type) {
      propsUI.push(
        <TextInput property={properties[p]} metadata={meta[p]} key={RLK('TI')} />
      );
    }
  });
  const { title, description } = metadata[groupName]._groupMeta || {};
  return (
    <div key={RLK('PG')} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader label={title || groupName} />
        </summary>
        {description && (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>{description}</p>
        )}
        <ui-group group={groupName}>{propsUI}</ui-group>
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
