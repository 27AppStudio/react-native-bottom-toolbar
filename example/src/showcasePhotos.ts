// Photos from Unsplash (unsplash.com, Unsplash License), hotlinked as its API guidelines ask.
// Credited in the README under the screenshots. Picked with the Unsplash API search.
export type Photo = { id: string; url: string; by: string; page: string };

export const sized = (p: Photo, w: number, h = w) =>
  `${p.url}&w=${w}&h=${h}&fit=crop&q=80&auto=format`;

export const VIEWER: Photo = {
  id: 'RErH8Q44nRk',
  url: 'https://images.unsplash.com/photo-1645705250941-0af036402d56?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8MTB8fHRyYXZlbCUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3OTUxMDc4NzF8MA&ixlib=rb-4.1.0',
  by: 'sun Binbin',
  page: 'https://unsplash.com/photos/a-truck-that-is-sitting-in-the-water-RErH8Q44nRk',
};
export const NOTE: Photo = {
  id: 'atSUvc1hMwk',
  url: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?ixid=M3wxMTM4ODM5fDB8MXxzZWFyY2h8NHx8YmVhY2glMjBzdW1tZXJ8ZW58MXx8fHwxNzk1MTA3ODcyfDA&ixlib=rb-4.1.0',
  by: 'Nattu Adnan',
  page: 'https://unsplash.com/photos/aerial-nature-photography-of-green-palms-on-seashore-during-daytime-atSUvc1hMwk',
};
