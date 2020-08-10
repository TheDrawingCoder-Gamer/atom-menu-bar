'use babel';
var CSON = require('cson');
var path = require('path');
var fs = require('fs');
function exists(obj) {
  return (obj !== null && obj !== undefined && (typeof obj !== 'object' || obj.length !== 0));
}

export default class AtomMenuBarView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-menu-bar');
    //create namespaces
    var iconNameSpace = {};
    var menuNameSpace = {};
    //function to get keymaps from registry
    //function to fetch menu trees
    function fetchMenuTrees(tab) {
      let sanitizeSubMenus = function(submenu = []) {
        let standinMenu = [];
        Object.assign(standinMenu, submenu);
        let sanitizer = /[&]/;
        for (var menuOpt in standinMenu) {
          if (standinMenu.hasOwnProperty(menuOpt)) {
            menuOpt.label = menuOpt.label.replace(sanitizer, '');
            if (exists(menuOpt.submenu)) {
              sanitizeSubMenus(menuOpt.submenu);
            }
          }
        }
        return standinMenu;
      };
      let registry;
      Object.assign(registry, atom.menu.template);
      let sanitizer = /[&]/;

      for (let menuTab in registry) {
        menuTab.label = menuTab.label.replace(sanitizer, '');
        if (menuTab.label === tab) {
          var menuReturn = menuTab.submenu;
          sanitizeSubMenus(menuTab.submenu)
          break;
        }
      }
      return menuReturn;
    }
    // function to complete icons
    let layoutPath = path.join(__dirname, '..', 'obj', 'menu-bar-layout.cson');
    let layoutObj = CSON.parseCSONString(fs.readFileSync(layoutPath));
    let registerIcons = (obj, iconNameSpace, menuNameSpace)  => {
      for (var icon in obj) {
        if (obj.hasOwnProperty(icon)) {
          iconNameSpace[icon.label] = document.createElement('div');
          iconNameSpace[icon.label].classList.add('amb--icon');
          if (exists(obj[icon].icon)) {
            iconNameSpace[icon.label].classList.add('icon', 'icon-' + obj[icon].icon);
          }
          if (exists(obj[icon].separator)) {
            iconNameSpace[icon.label].classList.add('amb--separator');
          }
          if (exists(obj[icon].action)) {
            iconNameSpace[icon.label].addEventListener('click', () => {
              atom.commands.dispatch(atom.views.getView(atom.workspace), obj[icon].action);
            });
          }
          if (exists(obj[icon].hover)) {
            iconNameSpace[icon.label].title = obj[icon].hover;
          }
          if (exists(obj[icon].menu)) {
            let menu = document.createElement('div');
            menu.classList.add('amb--sub-menu');
            let registerMenus = (menu, icon1, parent, _iconNameSpace, menuNameSpace) => {
              let getKeyMapFor = (command) => {
                let registry = atom.keymaps.keyBindings;
                for (let binding = 0; binding < registry.length; binding++) {
                  if (registry[binding].command === command) {
                    return registry[binding].keystrokes.replace(/[-]/, '+');
                  }
                }
              }
              for (let option = 0; option < menu.length; option++) {
                let optStr = String.toString(option);
                menuNameSpace[icon1 + optStr] = document.createElement('div');
                menuNameSpace[icon1 + optStr].classList.add('amb--sub-menu-child');
                // TODO: Make label and things
                let text = document.createElement('div');
                let separator = document.createElement('div');
                let keymaps = document.createElement('div');
                text.classList.add('amb--inline', 'amb--label');
                separator.classList.add('amb--inline', 'amb--separator');
                keymaps.classList.add('amb--inline', 'amb--keymap');
                text.textContent = menu[option].label;
                let mapText = '';
                //menuNameSpace[icon1 + optStr].textContent = menu[option].label;
                if (exists(menu[option].action)) {
                  menuNameSpace[icon1 + optStr].addEventListener('click', () => {
                    atom.commands.dispatch(atom.views.getView(atom.workspace), menu[option].action);
                  });
                  mapText = getKeyMapFor(menu[option].action);
                  keymaps.textContent = mapText;
                }
                if (exists(menu[option].menu)) {
                  keymaps.classList.add('icon', 'icon-triangle-right');
                  let menu1 = document.createElement('div');
                  menu1.classList.add('amb--sub-menu');
                  registerMenus(menu[option].menu, icon1 + optStr, menu1, iconNameSpace, menuNameSpace);
                  menuNameSpace[icon1 + optStr].append(text, keymaps, menu1);
                } else {
                  menuNameSpace[icon1 + optStr].append(text, keymaps);
                }
                console.log(parent);
                parent.appendChild(menuNameSpace[icon1 + optStr]);
              } //end for

            } // end function
            registerMenus(obj[icon].menu, icon, menu, iconNameSpace, menuNameSpace);
            iconNameSpace[icon.label].appendChild(menu);
          }
          this.element.appendChild(iconNameSpace[icon.label]);
        } //end if

      } // end for
    }
    registerIcons(layoutObj, iconNameSpace, menuNameSpace);

  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
