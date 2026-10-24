import Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { palette } from '../config/palette';
import { homeMenu } from '../menus/homeMenu';
import { FighterView } from '../views/FighterView';
import { MenuView } from '../views/MenuView';
import { PixelText } from '../views/PixelText';
import { addMenuBackdrop } from '../views/MenuBackdrop';
import { isNativeApp, quitApp } from '../platform/native';
import { getContext } from './context';
import { SceneKey } from './keys';
import { useMonitorCamera } from './monitor';
import { VERSION } from '../version';

/** Main menu (the title is on the marquee): both fighters idling, START GAME (VS CPU), ONLINE, HOW TO PLAY, OPTIONS
 * and, in the Android app, QUIT. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.home);
  }

  create(): void {
    const { flow, input, lights, audio } = getContext(this);
    useMonitorCamera(this);
    lights.select(null);
    const cx = MONITOR.width / 2;
    addMenuBackdrop(this);
    new FighterView(this, 'p1', 84, 318);
    new FighterView(this, 'p2', 204, 318);

    // the Android app gets QUIT; the items then sit a little closer so the fighters stay clear
    const quit = isNativeApp() ? quitApp : undefined;
    const menu = new MenuView(this, homeMenu(flow, quit), 70, input, audio, undefined, quit ? 2 : undefined);
    this.add.rectangle(0, menu.bottom + 5, MONITOR.width, 13, palette.panel).setOrigin(0);
    new PixelText(this, cx, menu.bottom + 8, 'STICK MOVES - BUTTON SELECTS', {
      color: palette.lilac,
      align: 'center',
      shadow: palette.ink,
    });
    new PixelText(this, MONITOR.width - 3, MONITOR.height - 10, `V${VERSION}`, {
      color: palette.dim,
      align: 'right',
      shadow: palette.ink,
    });
  }
}
