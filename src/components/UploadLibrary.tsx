"use client";
/* eslint-disable @next/next/no-img-element */
import { ImagePlus, Plus } from "lucide-react";
import DeskWindow from "@/components/DeskWindow";
import type { UploadAsset } from "@/lib/store";
export default function UploadLibrary({assets,onClose,onUpload,onPlace}:{assets:UploadAsset[];onClose:()=>void;onUpload:()=>void;onPlace:(asset:UploadAsset)=>void}) {
  return <DeskWindow className="library-window" title="Your collection" onClose={onClose}>
    {assets.length > 0 && <div className="library-toolbar"><span>All your uploads, in one place.</span><button onClick={onUpload}><Plus size={14}/> Upload</button></div>}
    {assets.length ? <div className="library-grid">{assets.map(asset=><button className="library-file" key={asset.id} title={`Place ${asset.name} in the box`} onClick={()=>onPlace(asset)}><div><img src={asset.src} alt="" draggable={false}/><span>+</span></div><span>{asset.name}</span></button>)}</div> : <div className="library-empty"><ImagePlus size={32}/><strong>Your collection starts here.</strong><span>Upload a photo or transparent object.</span><button className="primary-button" onClick={onUpload}>Choose files</button></div>}
    <footer>Click a file to place a copy · Originals stay in this folder</footer>
  </DeskWindow>;
}
