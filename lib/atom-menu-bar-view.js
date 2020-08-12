'use babel';
var CSON = require('cson');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
function exists(obj) {
  return (obj !== null && obj !== undefined && (typeof obj !== 'object' || Object.keys(obj).length !== 0));
}
const removeChildren = function(element) {
  while (element.firstElementChild) {
    element.lastElementChild.remove();
  }
}
const newLocal = (obj, parent) => {
    const fetchMenuTrees = function(tab) {
        let sanitizeSubMenus = function(submenu = []) {
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
            // TODO: Make label and things
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
            if (exists(menu[option].separator)) {
                menuChildElement.classList.add('amb--menu-line');
                continue;
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
    for (var icon in obj) {
        if (obj.hasOwnProperty(icon)) {
            if (exists(obj[icon].file)) {
                Object.defineProperty(obj[icon], 'submenu', {
                    value: fetchMenuTrees(obj[icon].file)
                });
                console.log(obj[icon]);
            }
            let iconElement = document.createElement('div');
            iconElement.classList.add('amb--icon');
            if (exists(obj[icon].icon)) {
                iconElement.classList.add('icon', 'icon-' + obj[icon].icon);
            }
            if (exists(obj[icon].separator)) {
                if (obj[icon].separator === 'wide') {
                    iconElement.classList.add('amb--separator');
                    afterSeperator = true;
                }
                else {
                    iconElement.classList.add('amb--bar-line');
                }
            }
            if (exists(obj[icon].hover)) {
                iconElement.title = obj[icon].hover;
            }
            if (exists(obj[icon].command)) {
                //console.log(obj[icon].command);
                //apparently required
                let command = obj[icon].command;
                //console.log(typeof obj[icon].command);
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
            }
            parent.appendChild(iconElement);
        }
    }
};
export default class AtomMenuBarView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-menu-bar');
    //create namespaces
    // function to complete icons
    let layoutPath = path.join(__dirname, '..', 'obj', 'menu-bar-layout.cson');
    let layoutObj = CSON.parseCSONString(fs.readFileSync(layoutPath));
    let registerIcons = newLocal
    registerIcons(layoutObj, this.element);

  }

  attached () {

  }
  deattached () {

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
