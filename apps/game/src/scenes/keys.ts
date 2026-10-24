export const SceneKey = {
  boot: 'Boot',
  logo: 'Logo',
  home: 'Home',
  options: 'Options',
  howTo: 'HowTo',
  lobby: 'Lobby',
  fight: 'Fight',
  result: 'Result',
  transition: 'Transition',
} as const;

/** Scenes drawn on the monitor (stopped and started by SceneFlow). */
export const MONITOR_SCENES = [
  SceneKey.logo,
  SceneKey.home,
  SceneKey.options,
  SceneKey.howTo,
  SceneKey.lobby,
  SceneKey.fight,
  SceneKey.result,
] as const;
