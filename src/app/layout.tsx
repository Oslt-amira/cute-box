import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {icons:{icon:[{url:"/favicon.svg",type:"image/svg+xml"},{url:"/favicon.ico",sizes:"32x32",type:"image/x-icon"}]},title:"·",description:"Your own little keepsake box. Collect photos, type little thoughts, doodle, and stay a while."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
