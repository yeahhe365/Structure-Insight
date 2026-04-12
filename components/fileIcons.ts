type IconEntry = { icon: string; color: string };

const specialFileMap = new Map<string, IconEntry>([
  ['package.json', { icon: 'fa-solid fa-cube', color: 'text-[#CB3837]' }],
  ['dockerfile', { icon: 'fa-solid fa-box', color: 'text-[#2496ED]' }],
  ['makefile', { icon: 'fa-solid fa-gavel', color: 'text-gray-500' }],
  ['jenkinsfile', { icon: 'fa-solid fa-diagram-project', color: 'text-[#D24939]' }],
  ['readme.md', { icon: 'fa-solid fa-book-open', color: 'text-gray-700 dark:text-gray-300' }],
  ['.gitignore', { icon: 'fa-solid fa-code-branch', color: 'text-[#F05032]' }],
  ['.gitattributes', { icon: 'fa-solid fa-code-branch', color: 'text-[#F05032]' }],
]);

const extensionMap = new Map<string, IconEntry>([
  ['html', { icon: 'fa-solid fa-file-code', color: 'text-[#E34F26]' }],
  ['htm', { icon: 'fa-solid fa-file-code', color: 'text-[#E34F26]' }],
  ['css', { icon: 'fa-solid fa-file-code', color: 'text-[#1572B6]' }],
  ['scss', { icon: 'fa-solid fa-file-code', color: 'text-[#CC6699]' }],
  ['sass', { icon: 'fa-solid fa-file-code', color: 'text-[#CC6699]' }],
  ['less', { icon: 'fa-solid fa-file-code', color: 'text-[#1D365D]' }],
  ['js', { icon: 'fa-solid fa-file-code', color: 'text-[#F7DF1E]' }],
  ['cjs', { icon: 'fa-solid fa-file-code', color: 'text-[#F7DF1E]' }],
  ['mjs', { icon: 'fa-solid fa-file-code', color: 'text-[#F7DF1E]' }],
  ['ts', { icon: 'fa-solid fa-file-code', color: 'text-[#3178C6]' }],
  ['jsx', { icon: 'fa-solid fa-file-code', color: 'text-[#61DAFB]' }],
  ['tsx', { icon: 'fa-solid fa-file-code', color: 'text-[#61DAFB]' }],
  ['vue', { icon: 'fa-solid fa-file-code', color: 'text-[#4FC08D]' }],
  ['svelte', { icon: 'fa-solid fa-code', color: 'text-[#FF3E00]' }],
  ['php', { icon: 'fa-solid fa-file-code', color: 'text-[#777BB4]' }],
  ['py', { icon: 'fa-solid fa-file-code', color: 'text-[#3776AB]' }],
  ['pyc', { icon: 'fa-solid fa-file-code', color: 'text-[#3776AB]' }],
  ['java', { icon: 'fa-solid fa-file-code', color: 'text-[#007396]' }],
  ['class', { icon: 'fa-solid fa-file-code', color: 'text-[#007396]' }],
  ['jar', { icon: 'fa-solid fa-file-code', color: 'text-[#007396]' }],
  ['rb', { icon: 'fa-solid fa-gem', color: 'text-[#CC342D]' }],
  ['go', { icon: 'fa-solid fa-file-code', color: 'text-[#00ADD8]' }],
  ['rs', { icon: 'fa-solid fa-file-code', color: 'text-[#DEA584]' }],
  ['swift', { icon: 'fa-solid fa-file-code', color: 'text-[#F05138]' }],
  ['c', { icon: 'fa-solid fa-c', color: 'text-[#555555]' }],
  ['h', { icon: 'fa-solid fa-c', color: 'text-[#555555]' }],
  ['cpp', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['hpp', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['cc', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['cs', { icon: 'fa-solid fa-code', color: 'text-[#239120]' }],
  ['sh', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['bash', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['zsh', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['ps1', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['bat', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['cmd', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['json', { icon: 'fa-solid fa-code', color: 'text-yellow-600' }],
  ['xml', { icon: 'fa-solid fa-code', color: 'text-orange-500' }],
  ['yaml', { icon: 'fa-solid fa-list', color: 'text-purple-500' }],
  ['yml', { icon: 'fa-solid fa-list', color: 'text-purple-500' }],
  ['toml', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['ini', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['env', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['sql', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  ['db', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  ['sqlite', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  ['md', { icon: 'fa-solid fa-file-lines', color: 'text-gray-700 dark:text-gray-300' }],
  ['txt', { icon: 'fa-solid fa-file-lines', color: 'text-gray-400' }],
  ['pdf', { icon: 'fa-solid fa-file-pdf', color: 'text-red-500' }],
  ['doc', { icon: 'fa-solid fa-file-word', color: 'text-blue-700' }],
  ['docx', { icon: 'fa-solid fa-file-word', color: 'text-blue-700' }],
  ['xls', { icon: 'fa-solid fa-file-excel', color: 'text-green-600' }],
  ['xlsx', { icon: 'fa-solid fa-file-excel', color: 'text-green-600' }],
  ['csv', { icon: 'fa-solid fa-file-excel', color: 'text-green-600' }],
  ['ppt', { icon: 'fa-solid fa-file-powerpoint', color: 'text-orange-600' }],
  ['pptx', { icon: 'fa-solid fa-file-powerpoint', color: 'text-orange-600' }],
  ['png', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['jpg', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['jpeg', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['gif', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['svg', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['ico', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['webp', { icon: 'fa-solid fa-file-image', color: 'text-purple-500' }],
  ['mp3', { icon: 'fa-solid fa-file-audio', color: 'text-yellow-600' }],
  ['wav', { icon: 'fa-solid fa-file-audio', color: 'text-yellow-600' }],
  ['ogg', { icon: 'fa-solid fa-file-audio', color: 'text-yellow-600' }],
  ['mp4', { icon: 'fa-solid fa-file-video', color: 'text-pink-600' }],
  ['mov', { icon: 'fa-solid fa-file-video', color: 'text-pink-600' }],
  ['avi', { icon: 'fa-solid fa-file-video', color: 'text-pink-600' }],
  ['webm', { icon: 'fa-solid fa-file-video', color: 'text-pink-600' }],
  ['zip', { icon: 'fa-solid fa-file-zipper', color: 'text-amber-600' }],
  ['rar', { icon: 'fa-solid fa-file-zipper', color: 'text-amber-600' }],
  ['7z', { icon: 'fa-solid fa-file-zipper', color: 'text-amber-600' }],
  ['tar', { icon: 'fa-solid fa-file-zipper', color: 'text-amber-600' }],
  ['gz', { icon: 'fa-solid fa-file-zipper', color: 'text-amber-600' }],
  ['ttf', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['otf', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['woff', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['woff2', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
]);

const defaultIcon: IconEntry = { icon: 'fa-solid fa-file', color: 'text-gray-400 dark:text-gray-500' };

const getFileIcon = (fileName: string): IconEntry => {
  const lowerName = fileName.toLowerCase();
  const special = specialFileMap.get(lowerName);

  if (special) {
    return special;
  }

  if (lowerName.endsWith('.config.js') || lowerName.endsWith('.config.ts')) {
    return { icon: 'fa-solid fa-gear', color: 'text-gray-500' };
  }

  const ext = lowerName.split('.').pop()!;
  return extensionMap.get(ext) ?? defaultIcon;
};

export type { IconEntry };
export { getFileIcon };
