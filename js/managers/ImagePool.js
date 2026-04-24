/**
 * ImagePool
 * Each entry: { key (filename without ext), answer, aliases[] }
 * Images should be placed in /images/ directory.
 * 
 * To add images: drop a .jpg/.png in /images/ and add an entry here.
 */
const IMAGES = [
  { key: 'apple',       answer: 'apple',      aliases: ['apples'] },
  { key: 'cat',         answer: 'cat',        aliases: ['kitten', 'kitty'] },
  { key: 'car',         answer: 'car',        aliases: ['automobile', 'vehicle'] },
  { key: 'tree',        answer: 'tree',       aliases: ['trees'] },
  { key: 'panda',       answer: 'panda',      aliases: ['pandas'] },
];

module.exports = IMAGES;