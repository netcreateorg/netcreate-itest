## Code Style Guidelines

0. **Javascript version is ES2018**
1. **Avoid needless indirection** - Don't create wrapper functions that just call other functions without adding value
2. **Minimize the number of passed arguments in functions** - Keep parameter counts reasonable (ideally 3 or fewer). You can use objects to package more context if needed. For options, put the object at the end. For operating on an object, make sure it is the **first** parameter and that the function name implies this. 
3. **Avoid unnecessary parameter reforwarding** - Prefer rederiving values locally rather than passing them through multiple function calls; this is often a sign the architecture needs to be refactored.
4. **Function naming conventions:**
   - Use **Action + Object [+ Specifier]** pattern (e.g., `GetDataset`, `UpdateDatabase`, `RequestLockNode`)
   - Important! Function and Method names should describe what they actually do.
   - **Exported API methods**: PascalCase, designed to work with module scope (e.g., `MODULE.GetTemplate`)
   - **Class methods**: camelCase for method names within class declarations
   - **Module methods**: PascalCase for all method names, with the exception of prefixed methods (see below)
   - **UPPERCASE prefixes** for operation classes: `PKT_`, `CLI_`, `NET_` (e.g., `PKT_GetDataset`, `CLI_UpdateLockState`)
   - **m_ prefix** for local helper functions, potentially with side effects (e.g., `m_TranslateLegacyDefinition`, `m_BackupDatabase`)
   - **u_ prefix** for pure utility functions. For functions created inside other functions, use u_ as prefix for an arrow function expression.
   - **s_ prefix** for string formatting functions
   - **async_ prefix** for async/await arrow functions created inside other functions
   - **r_ prefix** for internal recursive functions
   - **Promise functions**: Prepend `Promise` to first capitalized letter after any underscore (e.g., `PromiseLoadTemplate`, `m_PromiseSaveData`)
   - **ID convention**: Always use `ID` (uppercase) when referring to identifier keys in function names (e.g., `GetNodeID`, `PKT_CalculateMaxNodeID`)
5. **Avoid long ternary expressions** - Simple ternaries are OK, or create variables that compute each expression to simplify ternary.
6. **Avoid deeply nested expressions in general** - Break complex expressions into intermediate variables
7. **Avoid nested conditions when possible** - Use early return with success fall-through (e.g. guard clauses) to minimize if-then-else hell
8. **Use fallthrough assignment pattern** - To avoid if-else nesting when conditionally setting values, use successive fallback assignment when possible. `let value = lookup(); if (!value) value = fallback1 || fallback2 || fallback3`
9. **Inner function conventions** - When creating functions inside functions, use `u_` prefix and arrow function expressions
10. **Variable naming**:
   - **Internal declarations**: lowercase, unique, short, consistently used within function scope
   - **Function parameters**: short camelCase to distinguish from internal declarations, consistently used across functions
   - **Global search requirement**: parameters must be unique enough for safe global search/replace within a module
   - **Metadata prefix**: Use `_` prefix for metadata properties in data objects (e.g., `_ui`, `_editor`, `_schemaVersion`)
11. **Special String Literals vs Constants**:
   - Use string literals for short, human-readable tokens rather than defining/importing a constant. This makes debugging easier.
   - Do use constants for long strings intended for machine consumption (UUIDs, hashes). 
   - With Typescript, a limited set of string literals can be defined as a type to avoid typos (type Foo = 'cat' | 'dog')
   - Stick with all uppercase for high level operation scopes, lowercase or snakeCase for action-level scopes
12. **Message naming conventions**:
   - Pattern: `[SERVICE_CLASS]_[ACTION]_[SUBJECT]`
   - **SRV_ prefix**: Required for server-implemented handlers; client-implemented if omitted
   - **Service classes**: Short, distinct names (`DB`, `TEMPLATE`, `LOCK`) or client-based managers (`SIM`, `EDITOR`)
   - **Standardize [ACTION] names** by referring to the Glossary of Actions below. 
   - **Frame of reference**: Use names obvious to implementor as receiver, avoid receiver language to prevent caller confusion
13. **Commenting Conventions**
   - JSDoc comments are used for any `function` declared methods.
   - The JSDoc comment should accurately describe what the function does in system- or user-model operations and data, not just describe the technical operation
   - Use English instead of @param, @returns for JSDoc comments unless it's really needed
   - JSDoc first line should look like `/** API: Description` or `/** HELPER: Description` or similar.
   - JSDoc subsequent lines of text should be aligned with the first line's character text.
   - JSDoc trailing `*/` should be at the end of the last line of text.
   - Use comment separators using `/// - - -` form between functions
   - For exported methods, add comment with descriptive but concise arrow function style signature
   - Long comment blocks that describe function should be concise as possible and be consistent in referring to named variables and module names.
14. **Deprecated Code**
   - Deprecated code blocks should be removed entirely. A comment pointing to the github commit object url with the deprecated code can be provided, along with a short description of why it was removed.
   - Deprecrated code modules or source files should have a `deprecated_` filename prefix, with all imports updated if it is still in use. 
   - Deprecated methods that can't be safely removed yet should nevertheless use the `deprecated_` prefix for its naming.
15. **Naming Uniqueness**
   - Maintain uniqueness for ease of global search and replace. 
   - Don't reuse the same names across modules unless it is (1) a well-known industry convention like the use of `i` for loop iterators; (2) is a forwarded API method from another module using `export` syntax. THe key is that there is a **single source of truth** for a piece of code, not multiple dopplegangers. 
   - Ensure that the name is unique in its capitalization and use of prefixes. 
   - Use the function naming conventions, which help indicate scope of the named items as well as their uniqueness
   - Use well-known "design pattern" abbreviations to indicate the role of modules, such as the **Mgr** suffix for operations logic of a particular group of objects, **Factory** for object generators, and so on. 
16. **Separation of Concerns**
   - Keep data collection and data analysis as separate operations rather than mixing them in a single traversal.
17. **Semantic Accuracy** - Writing for Human to Human understanding of the codebase
   - Do comments reflect the actual parameters and intent of their associated code statements and blocks?
   - Are jsdoc comments consistently provided for functions?
   - Do parameter names reflect what they truly mean in operational terms, not technical jargon?
   - Do the variable and function names accurately represent what they are doing?
   - Are the named parameters, variable, and methods chosen to help visualize the actions in context of adjacent interoperations? Do they avoid falling back on technical jargon that provides no useful context?
   - Is care taken so that named parameters, variables, and methods are consistently used to make it clear they are the same kind of data or operation?
18. **Control Flow Ordering for Reader Comprehension** - Order conditional checks from specific to general to establish domain vocabulary before introducing pattern-matching logic. This supports progressive disclosure by helping readers understand the recognized/expected cases before encountering fallback or meta-pattern logic.
19. **Semantic Clustering in Conditionals** - Group related conditional checks with comments to create logical cohesion and communicate the problem domain taxonomy. Use `if-else` chains within categories to reinforce mutual exclusivity, moving from concrete cases through abstractions to general fallbacks. This is a helpful alternative to switch statements.
20. **Code as Documentation** - the structure of code communicates the designer's mental model of the problem domain in a clear progression of logic through the code.


