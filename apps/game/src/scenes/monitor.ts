import type Phaser from 'phaser';
import { MONITOR } from '../config/layout';
import { useScreenShader } from '../fx/crt';
import { getContext } from './context';

/**
 * Sets a scene's main camera up for the monitor: the scene draws in its own 288 x 360 space, and
 * the camera blows each pixel up to the cabinet's render scale (see CabinetView.renderScale).
 * Follows window resizes.
 */
export function useMonitorCamera(scene: Phaser.Scene): Phaser.Cameras.Scene2D.Camera {
  const { cabinet } = getContext(scene);
  const cam = scene.cameras.main;
  const place = () => {
    const k = cabinet.renderScale;
    cam
      .setViewport(0, 0, MONITOR.width * k, MONITOR.height * k)
      .setOrigin(0)
      .setZoom(k);
  };
  place();
  useScreenShader(cam);
  const off = cabinet.onResize(place);
  scene.events.once('shutdown', off);
  return cam;
}
