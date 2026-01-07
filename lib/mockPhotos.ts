export type Photo = {
  src: string;
  alt: string;
};

export const mockPhotos: Record<number, Photo> = {
  1: { src: "/mock/1.jpg", alt: "Day 1" },
  2: { src: "/mock/2.jpg", alt: "Day 2" },
  6: { src: "/mock/6.jpg", alt: "Day 6" },
  12:{ src: "/mock/12.jpg", alt: "Day 12" },
};
