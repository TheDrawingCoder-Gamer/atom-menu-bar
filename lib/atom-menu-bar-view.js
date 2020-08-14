'use babel';
var CSON = require('cson');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
const onChange = require('on-change');
function exists(obj) {
  return (obj !== null && obj !== undefined && (typeof obj !== 'object' || Object.keys(obj).length !== 0));
}
const removeChildren = function(element) {
  while (element.firstElementChild) {
    element.lastElementChild.remove();
  }
}
const sanitizeSubMenus = function(submenu = []) {
    let standinMenu = Object.values(_.cloneDeep(submenu));
    let sanitizer = /[&]/;
    for (let menuOpt = 0; menuOpt < standinMenu.length; menuOpt++) {
        if (exists(standinMenu[menuOpt].label)) {
            //console.log(standinMenu[menuOpt].label);
            standinMenu[menuOpt].label = standinMenu[menuOpt].label.replace(sanitizer, '');
            if (exists(standinMenu[menuOpt].submenu)) {
                standinMenu[menuOpt].submenu = sanitizeSubMenus(standinMenu[menuOpt].submenu);
            }
        }
        else if (exists(standinMenu[menuOpt].type)) {
            delete standinMenu[menuOpt].type;
            standinMenu[menuOpt].separator = 'line';
        }
    }
    //console.log(standinMenu);
    return standinMenu;
};
const registerIcons = (obj, parent) => {
    const fetchMenuTrees = function(tab) {

        let registry = _.cloneDeep(atom.menu.template);
        const replaceKeysInObj = (obj, oldKey, newKey, newObj = {}) => {
            if (typeof obj !== "object")
                return obj;
            for (let key in obj) {
                newObj[key === oldKey ? newKey : key] = replaceKeysInObj(obj[key], oldKey, newKey);
            }
            return newObj;
        };
        console.log(registry);
        let menuReturn = [];
        console.log(Object.values(registry).length);
        function sanitizeMain(obj) {
            obj.label = obj.label.replace(/[&]/, '');
            if (obj.label.toLowerCase() === tab.toLowerCase()) {
                menuReturn = sanitizeSubMenus(obj.submenu);
            }
            return obj;
        }
        registry = _.map(registry, sanitizeMain);
        return menuReturn;
    };
    const registerMenus = (menu, icon1, parent, aftSep) => {
        const getKeyMapFor = (command) => {
            let registry = atom.keymaps.keyBindings;
            for (let binding = 0; binding < registry.length; binding++) {
                if (registry[binding].command === command) {
                    let keymap = "";
                    for (let combination = 0; combination < registry[binding].keystrokeArray.length; combination++) {
                        keymap += registry[binding].keystrokeArray[combination];
                        keymap += " ";
                    }
                    keymap = keymap.trim();
                    return keymap;
                }
            }
        };
        for (let option = 0; option < menu.length; option++) {
            let optStr = String.toString(option);
            let menuChildElement = document.createElement('div');
            menuChildElement.classList.add('amb--sub-menu-child');
            if (aftSep) {
                menuChildElement.classList.add('amb--left-child');
            }
            let text = document.createElement('div');
            let keymaps = document.createElement('div');
            text.classList.add('amb--inline', 'amb--label');
            keymaps.classList.add('amb--inline', 'amb--keymap');
            if (aftSep) {
                keymaps.classList.add('amb--left-map');
                text.classList.add('amb--left-map');
            }
            text.textContent = menu[option].label;
            let mapText = '';
            //menuNameSpace[icon1 + optStr].textContent = menu[option].label;
            if (exists(menu[option].type)) {
              if (menu[option].type === 'separator-line') {
                menuChildElement.classList.add('amb--menu-line');
                continue;
              } else {
                console.warn('Invalid type input. Skipping...');
                continue;
              }
            }
            if (exists(menu[option].enabled) && !menu[option].enabled) {
              menuChildElement.disabled = true;
            }
            if (exists(menu[option].hidden) && menu[option].hidden) {
              menuChildElement.hidden = true;
            }
            if (exists(menu[option].command)) {
                let command = menu[option].command;
                menuChildElement.addEventListener('click', (event) => {
                    event.stopImmediatePropagation();
                    atom.commands.dispatch(atom.views.getView(atom.workspace), command);
                });
                mapText = getKeyMapFor(menu[option].command);
                keymaps.textContent = mapText;
            }
            if (exists(menu[option].submenu)) {
                if (aftSep) {
                    keymaps.classList.add('icon', 'icon-triangle-left');
                }
                else {
                    keymaps.classList.add('icon', 'icon-triangle-right');
                }
                let menu1 = document.createElement('div');
                menu1.classList.add('amb--sub-menu');
                registerMenus(menu[option].submenu, icon1 + optStr, menu1, aftSep);
                menuChildElement.append(keymaps, text, menu1);
            }
            else {
                menuChildElement.append(text, keymaps);
            }
            //console.log(parent);
            parent.appendChild(menuChildElement);
        } //end for
    }; // end function
    let afterSeperator = false;
    parent.classList.remove('amb--none')
    iconLoop:
    for (var icon = 0; icon < obj.length; icon++) {
            if (exists(obj[icon].file)) {
              switch (obj[icon].file.toLowerCase()) {
                case "file":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"File" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "edit":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"Edit" is aa platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "view":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"View" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "selection":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"Selection" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "help":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"Help" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "atom":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"Atom" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                case "window":
                  console.warn('File is a platform sensitive item. Skipping...');
                  atom.notifications.addWarning('"Window" is a platform sensitive item. Change your input for file.');
                  continue iconLoop;
                default:
                  Object.defineProperty(obj[icon], 'submenu', {
                      value: fetchMenuTrees(obj[icon].file)
                  });
              }
            }
            let iconElement = document.createElement('div');
            iconElement.classList.add('amb--icon');
            if (exists(obj[icon].icon)) {
                iconElement.classList.add('icon', 'icon-' + obj[icon].icon);
            } else if (exists(obj[icon].type)) {
              if (obj[icon].type === 'separator-wide') {
                if (!afterSeperator) {
                  iconElement.classList.add('amb--separator');
                  afterSeperator = true;
                } else {
                  atom.notifications.addError("There were 2 or more wide separators. Unattaching menu bar.");
                  removeChildren(parent);
                  parent.classList.add('amb--none');
                  break;
                }
              }
              else if (obj[icon].type === 'separator-line') {
                  iconElement.classList.add('amb--bar-line');
              } else {
                console.error('Invalid type. Unattaching Menu Bar.');
                atom.notifications.addError('An Invalid Type was Inputed to Atom Menu Bar. Unattaching Menu Bar.');
                removeChilden(parent);
                parent.classList.add('amb--none');
                break;
              }
            } else {
              console.warn('There is no icon or type property. Using "Unverified" symbol.');
              atom.notifications.addWarning('There is no icon or type property. Using "Unverified" symbol.');
              obj[icon].icon = 'unverified';
            }
            if (exists(obj[icon].hover)) {
                iconElement.title = obj[icon].hover;
            }
            if (exists(obj[icon].command)) {
              let command = obj[icon].command;
              iconElement.addEventListener('click', () => {
                atom.commands.dispatch(atom.workspace.element, command);
              });
            }
            if (exists(obj[icon].submenu)) {
              let menu = document.createElement('div');
              menu.classList.add('amb--sub-menu');
              if (afterSeperator) {
                menu.classList.add("amb--left-menu");
              }
              registerMenus(obj[icon].submenu, icon, menu, afterSeperator);
              iconElement.appendChild(menu);
            }  else if (!exists(obj[icon].type) && !exists(obj[icon].command)) {
              console.error('There is no type, command or submenu. Unattaching menu bar.');
              atom.notifications.addError('There\'s no command, type, or submenu in an icon. Unattaching Menu Bar.');
              removeChildren(parent);
              parent.classList.add('amb--none');
              break;
            }
            parent.appendChild(iconElement);
    }
};
export default class AtomMenuBarView {


  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-menu-bar');
    let value = serializedState;
    var that = this;
    this.disposable = atom.commands.add("atom-workspace", "atom-menu-bar:register", () => {
      that.register(atom.config.get('atom-menu-bar.layout'));
    });
    registerIcons(value, this.element);
  }
  register (value) {
    removeChildren(this.element);
    this.parsed = CSON.parseString(value);
    registerIcons(this.parsed, this.element);
  }
  // Returns an object that can be retrieved when package is activated
  serialize() {
    //store config. Is this needed?
    return atom.config.get('atom-menu-bar.layout');
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.disposable.dispose();
  }

  getElement() {
    return this.element;
  }

}
