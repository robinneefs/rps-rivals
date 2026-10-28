import { SERVER_URL } from '../config/online';
import type { SceneFlow } from '../scenes/flow';
import type { MenuItem } from './MenuItem';

/** Three choices on the illustrated home screen. */
export const homeMenu = (flow: SceneFlow): MenuItem[] => [
  {
    id: 'cpu',
    label: 'PLAY VERSUS CPU',
    enabled: true,
    onSelect: () => flow.toCharacterSelect({ mode: 'cpu', cpu: 'random' }),
  },
  // greyed out in a build that has no match server address
  SERVER_URL
    ? { id: 'online', label: 'PLAY ONLINE', enabled: true, onSelect: () => flow.toLobby() }
    : { id: 'online', label: 'PLAY ONLINE', enabled: false },
  { id: 'options', label: 'OPTIONS', enabled: true, onSelect: () => flow.toOptions() },
];
