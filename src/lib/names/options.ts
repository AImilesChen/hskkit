export type NameMode='meaning'|'english'|'character';
export type NameTheme='modern'|'poetic'|'classical'|'wuxia';
export const nameThemes=[
  {id:'modern',label:'Modern & natural',description:'Familiar sounds and straightforward meanings.'},
  {id:'poetic',label:'Gentle & poetic',description:'Soft sounds, nature and expressive imagery.'},
  {id:'classical',label:'Classical & elegant',description:'A literary feel with restrained, classical imagery.'},
  {id:'wuxia',label:'Wuxia & adventure',description:'Freedom, landscapes and a spirit of adventure.'},
] as const;
