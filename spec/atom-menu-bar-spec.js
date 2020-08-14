/* eslint-env jasmine, node */
'use babel'

import AtomMenuBar from '../lib/atom-menu-bar'

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('AtomMenuBar', () => {
  it('attaches a menu bar to the top of the workspace.', () => {
    expect(AtomMenuBar.atomMenuBarView.getElement().hidden).toBe(false)
    expect(AtomMenuBar.atomMenuBarView.getElement().closest('*')).toBe(document.querySelector('atom-panel.header.tool-panel.panel-header'))
  })
})
