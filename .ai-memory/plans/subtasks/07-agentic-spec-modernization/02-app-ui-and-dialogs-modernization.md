# Subtask 02: App UI, Dialogs & Modals Modernization (Folder 24)

Traceability ID: Task-04
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/24-app-ui-design-system/01-dialog-ui-component-system.md, 02-spec/24-app-ui-design-system/02-modal-and-drawer-architecture.md, 02-spec/24-app-ui-design-system/03-confirmation-and-prompt-dialogs.md, 02-spec/24-app-ui-design-system/04-toast-and-notification-overlays.md, 02-spec/24-app-ui-design-system/readme.md]
Action:
1. Create complete specifications for Dialog UI, Modal/Drawer, Confirmation Dialogs, and Toasts under `02-spec/24-app-ui-design-system/`.
2. Ground all components with concrete TypeScript interface definitions in dedicated contract blocks.
3. Enforce strict positive boolean conventions (`isOpen`, `isVisible`, `isPending`, `hasOverlay`).
4. Declare exact relative file paths for all components under `src/components/dialogs/`.
5. Update `02-spec/24-app-ui-design-system/readme.md` with inventory and cross-references.

Acceptance Criteria:
- `02-spec/24-app-ui-design-system/` contains non-empty specs for dialogs, modals, and overlays.
- All boolean properties use `is` or `has` prefixes exclusively.
- All component paths use relative paths from repo root.

Targeted Verification:
`Test-Path 02-spec/24-app-ui-design-system/01-dialog-ui-component-system.md` (exit 0)
