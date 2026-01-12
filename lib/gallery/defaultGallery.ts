// Default Gallery Exhibition
// Ephemeral gallery shown only when user has no uploads
// Disappears immediately on first user upload

export interface DefaultPost {
  id: string;
  imageUrl: string;
  caption: string;
  width: number;
  height: number;
}

export const DEFAULT_GALLERY_POSTS: DefaultPost[] = [
  {
    id: "default-1",
    imageUrl: "/mock/1.jpg",
    caption: "Morning light through the window",
    width: 1200,
    height: 1600,
  },
  {
    id: "default-2",
    imageUrl: "/mock/2.jpg",
    caption: "Stillness",
    width: 1600,
    height: 1200,
  },
  {
    id: "default-3",
    imageUrl: "/mock/3.jpg",
    caption: "Quiet corners",
    width: 1200,
    height: 1600,
  },
  {
    id: "default-4",
    imageUrl: "/mock/4.jpg",
    caption: "Afternoon shadows",
    width: 1600,
    height: 1200,
  },
  {
    id: "default-5",
    imageUrl: "/mock/6.jpg",
    caption: "Empty spaces",
    width: 1200,
    height: 1600,
  },
  {
    id: "default-6",
    imageUrl: "/mock/12.jpg",
    caption: "Light and time",
    width: 1600,
    height: 1200,
  },
  {
    id: "default-7",
    imageUrl: "/mock/1.jpg",
    caption: "Reflected moments",
    width: 1200,
    height: 1200,
  },
  {
    id: "default-8",
    imageUrl: "/mock/2.jpg",
    caption: "Between here and there",
    width: 1600,
    height: 1200,
  },
  {
    id: "default-9",
    imageUrl: "/mock/3.jpg",
    caption: "Waiting",
    width: 1200,
    height: 1600,
  },
  {
    id: "default-10",
    imageUrl: "/mock/4.jpg",
    caption: "Evening arrives",
    width: 1600,
    height: 1200,
  },
  {
    id: "default-11",
    imageUrl: "/mock/6.jpg",
    caption: "In between",
    width: 1200,
    height: 1600,
  },
  {
    id: "default-12",
    imageUrl: "/mock/12.jpg",
    caption: "Last light",
    width: 1600,
    height: 1200,
  },
];
