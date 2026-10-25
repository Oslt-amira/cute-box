export type ItemType = "image" | "note" | "sketch";

export type BaseItem = {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  name: string;
  locked: boolean;
  hidden: boolean;
  createdAt: number;
  updatedAt: number;
};

export type NoteStyle = "paper" | "card" | "slip";

export type ImageItem = BaseItem & {
  type: "image";
  src: string;
};

export type NoteItem = BaseItem & {
  type: "note";
  text: string;
  style: NoteStyle;
  fontSize: number;
};

export type SketchItem = BaseItem & {
  type: "sketch";
  dataUrl: string;
};

export type Item = ImageItem | NoteItem | SketchItem;

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const TIN_Z = 10;

export const defaultName = (type: ItemType, text?: string) => {
  if (type === "note" && text) return text.slice(0, 24);
  return { image: "Image", note: "Note", sketch: "Sketch" }[type];
};
