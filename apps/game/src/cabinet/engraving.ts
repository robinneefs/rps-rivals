import { VERSION } from '../version';
import './engraving.css';

/** Live lettering on the front control-panel lip, in the cabinet's own coordinate space. */
export function addCabinetEngravings(parent: HTMLElement): void {
  for (const [kind, text] of [
    ['signature', 'G Genie'],
    ['version', `v${VERSION}`],
  ] as const) {
    const inscription = document.createElement('div');
    inscription.className = `cabinet-engraving cabinet-engraving--${kind}`;
    inscription.dataset.engraving = kind;
    inscription.textContent = text;
    parent.append(inscription);
  }
}
