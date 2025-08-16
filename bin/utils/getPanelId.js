"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPanelId = getPanelId;
// src/utils/getPanelId.ts
function getPanelId(panels, docId) {
    if (!panels || !panels[docId])
        return undefined;
    const panel = panels[docId];
    if (typeof panel !== "object" || panel === null)
        return undefined;
    const keys = Object.keys(panel);
    return keys.length > 0 ? keys[0] : undefined;
}
