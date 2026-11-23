// Merapikan balasan AI: model kadang memakai markdown (**tebal**, # judul, - daftar, \( LaTeX \)).
// Tebal diubah jadi segmen bold sungguhan; simbol markdown lain dibuang agar tidak tampil sebagai bintang.

/**
 * @param {string} text
 * @returns {{ bold: boolean, text: string }[][]} baris → segmen
 */
export function formatReply(text) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '') // pembatas LaTeX
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n')
    .map((line) => {
      const clean = line
        .replace(/^\s{0,3}#{1,6}\s+/, '') // judul
        .replace(/^\s*[-*•]\s+/, '• ') // butir daftar
        .replace(/^\s*>\s?/, ''); // kutipan
      return splitBold(clean);
    });
}

function splitBold(line) {
  const segments = [];
  const re = /(\*\*|__)(.+?)\1/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    if (m.index > last) segments.push({ bold: false, text: stripStray(line.slice(last, m.index)) });
    segments.push({ bold: true, text: stripStray(m[2]) });
    last = re.lastIndex;
  }
  if (last < line.length) segments.push({ bold: false, text: stripStray(line.slice(last)) });
  return segments.filter((s) => s.text !== '');
}

/** Sisa penanda miring/tebal yang tidak berpasangan, mis. "*kata*" atau "**". Tanda kali "3 * 4" dibiarkan. */
function stripStray(s) {
  const isGap = (ch) => ch !== undefined && /[\s\d]/.test(ch);
  return s
    .replace(/\*{2,}|__/g, '')
    .replace(/\*/g, (m, i, str) => (isGap(str[i - 1]) && isGap(str[i + 1]) ? m : ''));
}
