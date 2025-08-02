<!-- UPDATE INSTRUCTIONS: Itemize software engineering principles and best practices that were discussed in this session, using terminology that is found in software engineering literature (e.g. design patterns, programming paradigms, trends) or computer science materials (e.g. algorithms, conceptual models, cognitive and human factors). Include principles and practices that could be inferred from the nature of the inquiry presented. Maintain a list of the principle/practice/patterns, and add the discovered mentions from this conversation beneath them. If a principle/pattern/practice does not yet exist, add it. Mention specific systems, code modules, and methods. The intent of this document is to see what concerns this developer is primarily focused on for later meta analysis -->

## Software Engineering Principles & Practices

### Code Style Guidelines & Conventions
- **Function parameter count limitations** (ideally 3 or fewer) - nc-settings-client.ts helper function design discussion
- **Consistent naming patterns** following Action + Object convention - u_ShouldUpdateProperty, u_ApplyPropertyUpdate naming
- **Avoiding needless indirection and parameter reforwarding** - rejected helper function approach that passed through DBG, PR, draft parameters

### Separation of Concerns
- **Data analysis vs data modification separation** - proposed u_ShouldUpdateProperty() for change detection vs u_ApplyPropertyUpdate() for mutation
- **Separating validation logic from business logic** - DecodePropDef validation separate from GetDispatcher mutation logic in nc-settings-client.ts

### Code Duplication & Refactoring
- **Recognition of verbose duplicated conditional logic** - GetDispatcher update operation array vs non-array branches in nc-settings-client.ts:175-243
- **Consideration of helper function extraction to reduce repetition** - attempted refactoring of three property access patterns (groupless, grouped, composite field)
- **Trade-offs between code clarity and abstraction** - decision to defer optimization in favor of explicit verbose implementation

### Immutable State Management Patterns
- **Immer.js integration for immutable updates** with mutable-style syntax - GetDispatcher using produce() and current() in nc-settings-client.ts
- **Draft/pending state pattern** for managing temporary changes - DraftObj with template/pending/isDirty/changeSet structure
- **Change tracking and dirty state management** - draft.changeSet.add() and draft.isDirty state updates

### Defensive Programming
- **Comprehensive error handling** with descriptive error messages - DecodePropDef validation, GetDispatcher property existence checks
- **Guard clauses and validation** at multiple levels - index parameter validation, pending/template reference equality checks
- **Type safety considerations** in TypeScript - DecodedArrayProp type, DraftObj interface definitions

### Data Structure Design
- **Indexed access patterns** for array elements - index parameter handling in DecodePropDef/EncodePropDef methods
- **Three-tier property access** (groupless, grouped, composite field) - GetDispatcher conditional logic branches in nc-settings-client.ts
- **PropDef string encoding/decoding** for property path resolution - DecodePropDef/EncodePropDef with [n] array syntax support

### State Machine Patterns
- **Action-based state transitions** - ActionObj with op: 'update'|'revert'|'submit' in nc-settings-client.ts GetDispatcher
- **Centralized state mutation** through single dispatcher function - produce() wrapper pattern with Immer

## Glossary of Actions
These keywords are used when naming API methods in code modules. They are chosen to be mirrors or common term pairs when possible that imply they do the opposite or bookend an operation
- Pure data fetches use: Get, Clone
- Data object construction use: Make
- Type and Status conditional checks use: Is, Has
- Implied Async operations use: Promise, Request, Reply
- Database operations use: Create, Read, Update, Delete Load, Save
- Recursive data fetches use: Gather
- Transcoding data between different formats use: Encode, Decode
- Single-access Resources and Asset operations use: Lock, Release
- Server/Client service declarations: Register, Unregister
- Server/Client identity connections use: Auth, Deauth
- Client/Server network messaging uses: Connect, Disconnect, Send, Signal, Call, Ping
- Process control: Start, Stop, Run, Pause, Resume, Reset, Kill, Init
- Transactions and Sessions: Begin, End

## Examples of Separation of Concerns
- Data, Derived Data, State, Derived State
- UI Data, Model Data
- Scope
