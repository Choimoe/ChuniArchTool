import { renderHome } from './home.js';
import { renderRinToLx } from './rin-to-lx.js';
import { renderMergeCsv } from './merge-csv.js';
import { renderEditScore } from './edit-score.js';

export const templates = {
  home: renderHome,
  'rin-to-lx': renderRinToLx,
  'merge-csv': renderMergeCsv,
  'edit-score': renderEditScore
};
