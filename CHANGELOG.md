### v0.03 (2025-09-13)
- FIX: update db migration scripts to include support for older structures (categories.section)
- FIX: apply npm security updates for Axios + Vite
- FIX: Dockerfile build files no longer need '--legacy-peer-deps' with recent updates
- Updated 'Settings => About => Updates' logic to be ridiculously overkill and customizable
- Updated 'Settings' menu including 'CSS' again by request => prev dev had moved to external file approach

### v0.02 (2025-09-08)
- Application categories can collapse
- Collapsible app cats can be configured settings > interface > categories
- FIX: bugs introduced by collapse Settings => state synchronization between pages
- FIX: restore 'CSS' menu option in Settings
- Updated nodemon 2.0.14 => 3.1.10 (security/vulnerability)
- Updated @types/node 16.11.6 => 24.3.1 (security/vulnerability)
- Updated redux-devtools-extension (requires Redux 3) => @redux-devtools/extension (Redux 5 and beyond)
- Updated codebase to remove extinct react-beautiful-dnd for @dnd-kit (security/vulnerability)

### v0.01 (2025-09-06)
- Fixed secure route blocking logging in via settings
- Fixed hardcoded JWT key (issue from orig repo: pawelmalak#465)
- Updated mdi icons to newest version 7.4.xx
- Complete security overhaul since 2023 update on original repo
