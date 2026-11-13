import lines from '@/data/chibi.json';

/**
 * Ambil kalimat chibi dari data, isi {placeholder}. Tanpa React agar mudah diuji.
 * @param {'home'|'lab'|'operations'} group
 * @param {string|null|undefined} key
 * @param {Record<string,string>} [vars]
 * @returns {{speaker:'girl'|'boy', mood:string, text:string}}
 */
export function chibiLine(group, key, vars = {}) {
  const table = lines[group] ?? {};
  const line = (key != null && table[key]) || table.default || { speaker: 'girl', mood: 'happy', text: '' };
  const text = line.text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? 'kamu');
  return { ...line, text };
}
