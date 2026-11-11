export const SceneKey = {
  boot: 'Boot',
  logo: 'Logo',
  home: 'Home',
  options: 'Options',
  characterSelect: 'CharacterSelect',
  lobby: 'Lobby',
  fight: 'Fight',
  result: 'Result',
  transition: 'Transition',
  artPreview: 'ArtPreview',
  sheetPreview: 'SheetPreview',
} as const;

/** Scenes drawn on the monitor (stopped and started by SceneFlow). */
export const MONITOR_SCENES = [
  SceneKey.artPreview,
  SceneKey.sheetPreview,
  SceneKey.logo,
  SceneKey.home,
  SceneKey.options,
  SceneKey.characterSelect,
  SceneKey.lobby,
  SceneKey.fight,
  SceneKey.result,
] as const;
