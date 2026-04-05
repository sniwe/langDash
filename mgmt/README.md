# mgmt layout

All management assets are packaged under `mgmt/projMap/`, `mgmt/toDo/`, `mgmt/errFix/`, and `mgmt/DLs/`.

- `projMap/map.json`: canonical project map artifact.
- `projMap/threads/`: thread discovery/cache for `::init`.
- `projMap/state/`: generated tracker state/history (`thread-map-deltas.json`).
- `projMap/modules/thread-map-tracker/`: reusable JS module for map delta tracking.
- `projMap/scripts/generate-map.ps1`: map generator and tracker orchestrator.
- `projMap/scripts/track-map-update.js`: runner for thread+map delta tracking.
- `toDo/` and `errFix/`: queue folders maintained with ordinal blank sentinels.
- `toDo/done/` and `errFix/fixed/`: manual completion destinations for cleared queue items.
- `DLs/`: mirrored Downloads staging area refreshed by the background queue worker.

DLs mirror rules:

- mirror files from `C:\Users\Qub\Downloads` whose `CreationTime` is the current date
- also mirror any `C:\Users\Qub\Downloads\...` path referenced anywhere under `mgmt\toDo\` or `mgmt\errFix\`
- keep the mirror sorted newest-first by creation time and refresh it idempotently
