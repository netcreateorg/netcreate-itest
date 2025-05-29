/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component
  used by mur-settings-client.jsx to generate a text input component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { DerefGroupDef } = RSB;
import TextInput from './MURTextInput';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GroupHeader(props) {
  const { label } = props;
  return (
    <span>
      <b>{label}</b>
    </span>
  );
}

/// COMPONENTS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PropertyGroup(props) {
  const {
    groupDef, // { groupname: { propname: { type, default }, {}... }
    metaDef // { groupname:{ propname: { _groupMeta, propname: metaDef, {}... } }
  } = props;
  if (DBG) {
    if (typeof groupDef !== 'object') return <p>PropertyGroup bad groupDef</p>;
    if (typeof metaDef !== 'object') return <p>PropertyGroup bad metaDef</p>;
  }
  const gdata = DerefGroupDef(groupDef);
  if (gdata.error) return <p>PropertyGroup bad groupDef {gdata.error}</p>;
  const { groupName, properties } = gdata;
  const propList = Object.keys(properties); // list of property names
  const meta = metaDef[groupName];
  const { title, description } = meta._groupMeta || {};
  const key = `pg-${groupName}`;
  return (
    <div key={key} style={{ margin: '1rem' }}>
      <details open>
        <summary>
          <GroupHeader label={title || groupName} />
        </summary>
        {description && (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>{description}</p>
        )}
        {propList.map(p => {
          if (properties[p].type) {
            const key = `in-${groupName}.${p}`;
            return <TextInput propDef={properties[p]} metaDef={meta[p]} key={key} />;
          }
          return null;
        })}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
