import type { MenuItem } from './MenuItem';

export const resultMenu = (actions: {
  retry: () => void;
  characterSelect: () => void;
  mainMenu: () => void;
}): MenuItem[] => [
  { id: 'retry', label: 'REMATCH', enabled: true, onSelect: actions.retry },
  { id: 'characterSelect', label: 'CHARACTER SELECT', enabled: true, onSelect: actions.characterSelect },
  { id: 'home', label: 'MAIN MENU', enabled: true, onSelect: actions.mainMenu },
];
