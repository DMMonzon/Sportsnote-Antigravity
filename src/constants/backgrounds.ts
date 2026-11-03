export interface SportBackground {
  sport: string;
  url: string;
  authorName: string;
  authorUrl: string;
  photoUrl: string;
}

export const SPORT_BACKGROUNDS: SportBackground[] = [
  {
    sport: 'Handball',
    url: 'https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    authorName: 'Oliver Sjöström',
    authorUrl: 'https://unsplash.com/@ollivves?utm_source=sportsnote&utm_medium=referral',
    photoUrl: 'https://unsplash.com/photos/3a06ce1ce699?utm_source=sportsnote&utm_medium=referral'
  },
  {
    sport: 'Vóley',
    url: 'https://images.unsplash.com/photo-1666901356149-93f2eb3ba5a2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    authorName: 'Vince Fleming',
    authorUrl: 'https://unsplash.com/@vincethesnap?utm_source=sportsnote&utm_medium=referral',
    photoUrl: 'https://unsplash.com/photos/93f2eb3ba5a2?utm_source=sportsnote&utm_medium=referral'
  },
  {
    sport: 'Hockey',
    url: 'https://images.unsplash.com/photo-1780509459807-d47e3571cc99?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    authorName: 'Jeffrey F Lin',
    authorUrl: 'https://unsplash.com/@jeffreyflin?utm_source=sportsnote&utm_medium=referral',
    photoUrl: 'https://unsplash.com/photos/d47e3571cc99?utm_source=sportsnote&utm_medium=referral'
  },
  {
    sport: 'Fútbol',
    url: 'https://images.unsplash.com/photo-1636373686369-2462fd1609ef?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    authorName: 'Emilio Garcia',
    authorUrl: 'https://unsplash.com/@garcia_e?utm_source=sportsnote&utm_medium=referral',
    photoUrl: 'https://unsplash.com/photos/2462fd1609ef?utm_source=sportsnote&utm_medium=referral'
  },
  {
    sport: 'Básquet',
    url: 'https://images.unsplash.com/photo-1659468711279-2857db123912?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    authorName: 'Markus Spiske',
    authorUrl: 'https://unsplash.com/@markusspiske?utm_source=sportsnote&utm_medium=referral',
    photoUrl: 'https://unsplash.com/photos/2857db123912?utm_source=sportsnote&utm_medium=referral'
  }
];
