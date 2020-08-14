'use babel';

import AtomMenuBarView from './atom-menu-bar-view';
import { CompositeDisposable } from 'atom';

export default {

  atomMenuBarView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomMenuBarView = new AtomMenuBarView(state.atomMenuBarViewState);
    this.modalPanel = atom.workspace.addHeaderPanel({
      item: this.atomMenuBarView.getElement()
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomMenuBarView.destroy();
  },

  serialize() {
    return {
      atomMenuBarViewState: this.atomMenuBarView.serialize()
    };
  },


};
