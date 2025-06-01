/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MUR Property Group Component

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const React = require('react');
const RSB = require('./react-settings-bridge');
const { DerefGroupDef } = RSB;
import TextInput from './MURTextInput';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;
const LOG = console.log.bind(console);

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
  const meta = metaDef[groupName] || {};
  const { title, description } = meta._groupMeta || {};
  const key = `pg-${groupName}`;
  return (
    <div key={key} style={{ margin: '1rem' }}>
      {console.log('>>rendering PropertyGroup', properties)}
      <details open>
        <summary>
          <GroupHeader label={title || groupName} />
        </summary>
        {description && (
          <p style={{ color: 'gray', fontStyle: 'italic' }}>{description}</p>
        )}
        {console.log(`>>> RENDERING ${propList.length} PROPERTIES`)}
        {propList.map(p => {
          if (properties[p].type) {
            const dotProp = `${groupName}.${p}`;
            const key = `in-${dotProp}`;

            return (
              <TextInput
                propDef={properties[p]}
                metaDef={meta[p]}
                dotProp={dotProp}
                key={key}
              />
            );
          } else console.log(`PropertyGroup: no type for ${groupName}.${p}`);
          return null;
        })}
      </details>
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PropertyGroup;
