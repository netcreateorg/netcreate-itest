# MUR SettingsEditor Recipe Book

The MURSettingsEditor rendering system distributes "property definition strings" (called a **propDef**) to child components so they "know" what they are supposed to render. 

Each child componen is called a **Control**. They all have access to a React Context that contains a **dispatch** function and a **draft** object. It uses its received `propDef` property in combination with `draft` to retrieve its rendering data through the magical function **GetDataForProp**.

```js
const { propDef } = props;
const { draft, hasLock, dispatch } = React.useContext(RSB.SettingsContext);
const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef);
```
The `controlData` is a collection of dictionaries that can be used to derived **rendering parameters** for a given control:
```js
const { groupName, propName, propField } = controlData; // helpful labels deconstructed from propDef
const { sourceMeta, sourceData } = controlData; // metadata and data from the template file
```
A control has to extract the sourceMeta and sourceData value to be able to draw the necessary UI elements, and is therefore specific to the control itself. In other words, not all controls may have the exact same metadata properties.

Once you've rendered a working control and want to update the template, you use the **dispatch** function to issue an update like this example from `MURTextInput.jsx`:
```js
const submitToSettings = async event => {
  const value = String(event.target.value);
  dispatch({
    op: 'update',
    propDef,
    value
  });
};
```
This will write the change to the `draft.pending` object that was read in the `React.useContext(RSB.SettingsContext)` line above. 

Because the `dispatch` function is a React Hook, it will trigger a remount of the component automagically if you have a dependency hook defined:
```js
// this is a workaround for React's stupidity about dataflow, state
// retention with hooks, and other bullshit.
React.useEffect(() => {
  if (!draft.pending) {
    const { value } = u_ExtractInputProps(controlData);
    setInputValue(value || defValue);
  }
}, [draft.pending]);
```

The user interface for actually **committing** the pending changes and writing to the template is handled by the root `MURSettingsEditor.jsx` component. WHen it changes, the entire component tree gets a change to rerender.

**Update Action Parameters**:

**Required Fields**:
- `op: 'update'` - Action type identifier
- `propDef: string` - Dotted path notation targeting template location
- `value: any` - New data to store at the propDef location

**PropDef Targeting**:
- `"fieldName"` - Root-level template field
- `"groupName.propName"` - Nested group property
- `"groupName.propName.fieldName"` - Composite object field
- `"groupName.arrayName[index]"` - Specific array element
- `"groupName.arrayName[index].fieldName"` - Field within array element

**Value Types**:
- **Primitive**: `value: "string"` or `value: 42`
- **Object**: `value: { color: "#ff0000", label: "Red" }`
- **Array**: `value: [...existingArray, newItem]`
- **Complex**: `value: { enabled: true, options: [...] }`

**Dispatch Flow**:
1. Component calls `dispatch({ op: 'update', propDef, value })`
2. `nc-settings-client.ts:GetDispatcher()` resolves propDef path
3. Immer updates `draft.pending` at resolved location
4. Context triggers component re-renders
5. Components read updated data via `draft.pending || draft.template`



## Recipe 0: Template Structure Modification

**What you're making**: Dynamic template changes that automatically update the UI through the pending state system.

**Ingredients**:
- React Context from `RSB.SettingsContext`
- Dispatch function for direct template updates
- Understanding of draft.pending vs draft.template priority
- Component reactive patterns with useEffect

**Steps**:
1. **Access the context**: `const { draft, dispatch } = React.useContext(RSB.SettingsContext)`
2. **Update template structure**: `dispatch({ op: 'update', propDef: 'newField', value: 'initial value' })`
3. **Handle reactive updates**: Use `useEffect(() => { ... }, [draft.pending])` to respond to cache changes
4. **Clear local state on revert**: Reset component state when `!draft.pending` (user canceled)

**Key patterns from MURTextInput.jsx**:
- **Line 71**: `RSB.GetDataForProp(draft.pending || draft.template, propDef)` - pending takes precedence
- **Lines 86-91**: `useEffect` pattern that resets local state when draft.pending is cleared
- **Lines 96-103**: Standard dispatch pattern for template updates
- **Line 139**: Template vs input comparison for visual feedback (`templateValue !== inputValue`)

**Template structure updates**:
```javascript
// Add new field to existing group
dispatch({ op: 'update', propDef: 'nodeDefs.newProperty', value: 'default' });

// Add new top-level field
dispatch({ op: 'update', propDef: 'globalSetting', value: { enabled: true } });

// Modify nested structure
dispatch({ op: 'update', propDef: 'edgeDefs.relationship.weight', value: 1.0 });

// Reactive component pattern:
// Component automatically redraws when template structure changes
React.useEffect(() => {
  if (!draft.pending) {
    // Template was reverted - reset local state
    const { value } = u_ExtractInputProps(controlData);
    setLocalValue(value || defaultValue);
  }
}, [draft.pending]);
```
Changes appear immediately in UI, persist in draft.pending until Save/Cancel, and components
automatically refresh when template structure changes.

## Recipe 1: Handling State and Caching

**What you're making**: Proper integration with the pending state system.

**Ingredients**:
- React Context from `RSB.SettingsContext`
- Dispatch function for state updates
- Understanding of draft vs template

**Steps**:
1. **Access context**: `const { draft, dispatch } = React.useContext(RSB.SettingsContext)`
2. **Read current data**: `draft.pending || draft.template` (pending takes precedence)
3. **Cache changes**: `dispatch({ op: 'update', propDef, value })` stores in pending
4. **Let parent handle save**: MURSettingsEditor handles `{ op: 'submit', saveFunction }`
5. **Handle cancellation**: MURSettingsEditor handles `{ op: 'revert' }`

**Key state flow**:
- Changes accumulate in `draft.pending`
- Nothing persists until user clicks Save in MURSettingsEditor
- Cancel discards all pending changes

**Check your work**: Look at `MURTextInput.jsx:69,96-102` for context usage and dispatch pattern.

---

## Recipe 2: Adding a New Control Type

**What you're making**: A new `_control` type that can be used in templates.

**Ingredients**:
- Component implementation
- Control type registration
- Template metadata with `_control` field

**Steps**:
1. **Build your component** following Recipe 1 or 2
2. **Register in MURCompositeGroup.jsx**: Add case in `u_RenderControlInput()`:
   ```javascript
   } else if (_control === 'your_control_type') {
     return <YourComponent propDef={propDef} key={key} />;
   ```
3. **Add to template**: In `_default.template.toml`:
   ```toml
   [_ui.yourField]
   _control = "your_control_type"
   label = "Your Field Label"
   ```
4. **Test with propDef**: Use `"yourField"` as propDef

**Check your work**: Look at `MURCompositeGroup.jsx:30-50` for control registration pattern.

---

## Recipe 3: Creating a Simple Input Component

**What you're making**: A new input component like `MURTextInput` for a custom data type.

**Ingredients**:
- A `propDef` string (e.g., "nodeDefs.customField")
- React component file in `@app/view/netcreate/components/`
- Template metadata in `_default.template.toml`

**Steps**:
1. **Create your component file** `MURYourInput.jsx`
2. **Import the bridge**: `const RSB = require('./react-settings-bridge')`
3. **Get your data**: `const controlData = RSB.GetDataForProp(draft.pending || draft.template, propDef)`
4. **Extract what you need**: Use helper like `u_ExtractInputProps(controlData)` for label, value, tooltip
5. **Handle changes**: `dispatch({ op: 'update', propDef, value })`
6. **Register in MURCompositeGroup.jsx**: Add case to `u_RenderControlInput()` function

**Key method signatures**:
- `RSB.GetDataForProp(template, propDef)` → `{ sourceMeta, sourceData, groupName, propName }`
- `dispatch(action)` where `action = { op: 'update', propDef, value }`

**Check your work**: Look at `MURTextInput.jsx:71-73` for the pattern.

---
# Unimplemented Extensions

## Unimplemented: Array Editor
_generated by Claude Code, probably wrong_

**What you're making**: A component that handles arrays like `commentTypes` with add/delete/sort.

**Ingredients**:
- Array propDef (e.g., "commentTypes")
- `_controlDef` metadata pointing to `_ui_defs` schema
- Individual item editor components

**Steps**:
1. **Get array metadata**: `const { _controlDef } = controlData.sourceMeta`
2. **Look up item schema**: `RSB.GetUIDefForType(template, _controlDef)`
3. **Render array items**: Map over `sourceData.map((item, index) => ...)`
4. **Create child propDefs**: `${propDef}[${index}]` for each item
5. **Handle array operations**:
   - **Add**: `const newArray = [...sourceData, newItem]`
   - **Delete**: `const newArray = sourceData.filter((_, i) => i !== index)`
   - **Sort**: `const sortedArray = [...sourceData].sort(...)`
6. **Dispatch array updates**: `dispatch({ op: 'update', propDef, value: newArray })`

**Key method signatures**:
- `RSB.GetUIDefForType(template, uiDef)` → schema object from `_ui_defs`
- Array propDef syntax: `"groupName.arrayName[index]"`

**Check your work**: Look at `MURColorGroup.jsx:57-106` for array operations.

---


# Appendix: System Architecture

## Core Data Flow

**Single Source of Truth**: `@app-templates/_default.template.toml` contains both legacy settings and `_ui` metadata mirror.

**Context Distribution**: `MURSettingsEditor.jsx` provides `SettingsContext` with `{ draft, dispatch, hasLock }` to all children.

**PropDef Resolution**: `react-settings-bridge.js:GetDataForProp(template, propDef)` returns `{ sourceMeta, sourceData }` for any dotted path.

**State Management**: `nc-settings-client.ts:GetDispatcher()` uses Immer to manage `{ template, pending, isDirty, changeSet }` state.

## Key Files and Responsibilities

**Template Management**:
- `@app-templates/_default.template.toml`: Canonical template with dual structure (legacy + `_ui`)
- `_ui_defs` section: Schema definitions for user-extensible types

**Core Infrastructure**:
- `@_mur/web-client/nc-settings-client.ts`: TypeScript state management with Immer
- `@app/view/netcreate/components/react-settings-bridge.js`: React bridge with `GetDataForProp()` resolver
- `@app/view/netcreate/components/MURSettingsEditor.jsx`: Root context provider with save/cancel transaction handling

**Component Architecture**:
- `@app/view/netcreate/components/MURCompositeGroup.jsx`: Recursive renderer with `u_RenderControlInput()` control dispatcher
- `@app/view/netcreate/components/MUR*.jsx`: Individual control implementations

**Legacy Integration**:
- `@app/view/netcreate/components/NCNode.jsx`: Hardcoded property handling (lines 443-454)
- `@app/view/netcreate/components/NCEdge.jsx`: Hardcoded property handling (lines 422-432)

## Data Structure Patterns

**PropDef Syntax**: 
- Simple: `"fieldName"`
- Grouped: `"groupName.fieldName"`  
- Composite: `"groupName.fieldName.subField"`
- Array: `"groupName.arrayName[index]"`
- Nested: `"groupName.arrayName[index].subField"`

**Control Metadata**:
```toml
[_ui.fieldName]
_control = "component_type"
_controlDef = "SchemaType"  # References _ui_defs
label = "Display Label"
help = "Help text"
```

**Schema Definitions**:
```toml
[_ui_defs]
CustomType = { field1 = "string", field2 = "ui_def" }
```

## Extension Points

**New Control Types**: Register in `MURCompositeGroup.jsx:u_RenderControlInput()`

**New Schema Types**: Add to `_ui_defs` section in template

**Custom Validation**: Extend `GetDataForProp()` resolution logic

**Legacy Integration**: Bridge between MUR components and existing NCNode/NCEdge hardcoded handling

 # PropDef Resolution Algorithm and Related Methods

  ## Core Resolution Algorithm

  The propDef resolution algorithm is centralized in `react-settings-bridge.js:GetDataForProp()` (lines 104-250), which
  implements a case-based resolver that maps dotted path notation to template data and metadata.

  ### Related Source Code Modules

  **Primary Dependencies:**
  - `Settings.DecodePropDef()` from `require('ursys-min')` → `@_mur/web-client/nc-settings-client.ts` (lines 92-93)
  - `Settings.EncodePropDef()` from `require('ursys-min')` → `@_mur/web-client/nc-settings-client.ts` (lines 97-98)

  **Supporting Modules:**
  - **Template source:** `UDATA.AppState('TEMPLATE')` from UNISYS system
  - **Schema validation:** `@app/unisys/server-template-util.js` and `@app/unisys/server-template-schema.js`

  ## PropDef Resolution Cases

  ### Case 0: Global Settings (lines 130-147)
  - **Input:** `propDef = ""`
  - **Logic:** Returns all global properties plus `_groupMeta`
  - **Method:** `GetUISettingsList(t_ui)` filters UI objects vs groups
  - **Returns:** `{ sourceMeta: {globalProps}, sourceData: template }`

  ### Case 1: Simple Properties (lines 151-177)
  - **Input:** `propDef = "propName"` or `propDef = "propName[index]"`
  - **Logic:** Direct template property lookup with optional array indexing
  - **Array handling:** `sourceData = template[propName][index]`, sets `_controlDef = 'CommentType'`
  - **Returns:** `{ sourceMeta: t_ui[propName], sourceData: template[propName] }`

  ### Case 2: Composite Fields (lines 181-221)
  - **Input:** `propDef = "groupName.propName.fieldName"` with optional `[index]`
  - **Logic:** Three-level nested property resolution
  - **Array support:** `template[groupName][propName][fieldName][index]`
  - **Returns:** `{ sourceMeta: t_ui[groupName][propName][fieldName], sourceData: resolved_value }`

  ### Case 3: Group Properties (lines 225-249)
  - **Input:** `propDef = "groupName.propName"` with optional `[index]`
  - **Logic:** Two-level nested property resolution
  - **Array support:** `template[groupName][propName][index]`
  - **Returns:** `{ sourceMeta: t_ui[groupName][propName], sourceData: resolved_value }`

  ## PropDef Parsing Algorithm

  ### DecodePropDef Implementation (from `nc-settings-client.ts:77-108`)

  **Input Parsing:**
  const [groupID, propID, fieldID, ...extra] = propDef.split('.');

  **Array Syntax Detection:**
  function u_DecodeArrayProp(propSeg) {
    const match = propSeg.match(/^(.)[(d)]$/);
    if (match) {
      if (match[2]) return { type: 'arrayIndex', name: match[1], index: parseInt(match[2]) };
      return { type: 'array', name: match[1] };
    }
  }

  **Return Patterns:**
  - **1 part:** `[undefined, propName, undefined]`
  - **2 parts:** `[groupName, propName, undefined]`
  - **3 parts:** `[groupName, propName, fieldName]`
  - **With array index:** `[groupName, propName, fieldName, index]`

  ### EncodePropDef Implementation (from `nc-settings-client.ts:113-145`)

  **Reconstruction Logic:**
  // Simple: groupID undefined → propID
  // Grouped: groupID.propID
  // Composite: groupID.propID.fieldID
  // Array: groupID.propID[index] or groupID.propID.fieldID[index]

  ## Schema Resolution Methods

  ### GetUIDefForType() (lines 256-265)
  - **Purpose:** Look up user-defined schemas from `template._ui_defs`
  - **Usage:** `RSB.GetUIDefForType(template, "CommentType")` → schema object
  - **Array components:** Use `_controlDef` metadata to reference schema types

  ### GetUISettingsList() (lines 289-312)
  - **Purpose:** Categorize UI metadata into globals vs groups
  - **Logic:** Uses `IsUIObj()` and `IsUIGroup()` to classify entries
  - **Filtering:** Skips internal keys starting with `_`

  ## Data/Metadata Separation

  ### Data Path Resolution:
  - **Source:** `template[groupName][propName][fieldName]`
  - **Array indexing:** `template[groupName][propName][index]` or `template[groupName][propName][fieldName][index]`

  ### Metadata Path Resolution:
  - **Source:** `template._ui[groupName][propName][fieldName]`
  - **Contains:** `_control`, `label`, `help`, `tooltip`, `_controlDef` properties
  - **Array metadata:** Points to `_ui_defs` schemas via `_controlDef`

  ## Error Handling

  **Validation Points:**
  - Template object validation (line 109-110)
  - PropDef string validation (line 111)
  - `_ui` metadata existence (line 118-119)
  - Path existence at each resolution level (lines 152, 183-192, 226-228)

  **Error Return Format:**
  return { error: "descriptive error message", groupName, propName, propField }

  ## Integration with State Management

  **Dispatch Integration (lines 75-77):**
  - Bridges to `Settings.Dispatch(state, action)` from `nc-settings-client.ts`
  - Handles `{ op: 'update', propDef, value }` actions
  - Manages Immer-based pending state through propDef resolution

  **Context Distribution (line 70):**
  - Provides `SettingsContext` for React component tree
  - Carries `{ draft, dispatch, hasLock }` to all child components
  - Enables propDef-based data access throughout component hierarchy

  This resolution algorithm is the core mechanism that enables the MUR system's propDef-based architecture, translating
  dotted path notation into precise template data and metadata lookups while supporting complex nested structures and
  arrays.
