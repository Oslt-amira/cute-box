import { get, set } from "idb-keyval";
import type { Item, ItemType, NoteStyle } from "./types";
import { uid, defaultName } from "./types";

const KEY = "cute-box-items";
const LIB_KEY = "cute-box-library";
const LID_KEY = "cute-box-lid";

function migrate(item: Record<string, unknown>): Item {
  const type = (item.type ?? "image") as ItemType;
  const base: Record<string, unknown> = {
    id: String(item.id ?? uid()),
    type,
    x: Number.isFinite(Number(item.x)) ? Number(item.x) : 200,
    y: Number.isFinite(Number(item.y)) ? Number(item.y) : 200,
    width: Number(item.width) || 200,
    height: Number(item.height) || 200,
    rotation: Number(item.rotation) || 0,
    zIndex: Number(item.zIndex) || 1,
    name: String(item.name ?? defaultName(type)),
    locked: Boolean(item.locked),
    hidden: Boolean(item.hidden),
    createdAt: Number(item.createdAt) || Date.now(),
    updatedAt: Number(item.updatedAt) || Date.now(),
  };
  if (type === "image") {
    base.src = String(item.src ?? "");
  }
  if (type === "note") {
    base.text = String(item.text ?? "");
    base.style = (item.style ?? "paper") as NoteStyle;
    base.fontSize = Number(item.fontSize) || 16;
  }
  if (type === "sketch") {
    base.dataUrl = String(item.dataUrl ?? "");
  }
  return base as Item;
}

export async function loadItems(): Promise<Item[]> {
  try {
    const v = await get<Item[]>(KEY);
    if (!v) return [];
    return v.map(migrate);
  } catch {
    return [];
  }
}
export async function saveItems(items: Item[]): Promise<void> {
  await set(KEY, items);
}
export async function loadLibrary(): Promise<string[]> {
  try {
    const v = await get<string[]>(LIB_KEY);
    return v ?? [];
  } catch {
    return [];
  }
}
export async function saveLibrary(lib: string[]): Promise<void> {
  await set(LIB_KEY, lib);
}
export async function loadLid(): Promise<boolean> {
  try {
    const v = await get<boolean>(LID_KEY);
    return v ?? false;
  } catch {
    return false;
  }
}
export async function saveLid(open: boolean): Promise<void> {
  await set(LID_KEY, open);
}
export type UploadAsset = {id:string;src:string;name:string;width:number;height:number};
export async function loadAssets():Promise<UploadAsset[]> {
  try {const assets = await get<UploadAsset[]>("cute-box-assets"); if(assets) return assets; const legacy = await loadLibrary(); return legacy.map(src=>({id:uid(),src,name:"Uploaded object",width:180,height:180}));} catch {return [];}
}
export async function saveAssets(assets:UploadAsset[]):Promise<void>{await set("cute-box-assets",assets);}
