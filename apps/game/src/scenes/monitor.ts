import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { useScreenShader } from '../fx/crt';
import { getContext } from './context';

/** Every scene renders directly into the native monitor framebuffer. */
export function useMonitorCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const { cabinet } = getContext(scene);
  const cam = scene.cameras.main;
  const place = () => {
    cam.setViewport(0, 0, MONITOR.width, MONITOR.height).setOrigin(0).setZoom(1);
  };
  place();
  useScreenShader(cam);
  const off = cabinet.onResize(place);
  scene.events.once('shutdown', off);
  return cam;
}
