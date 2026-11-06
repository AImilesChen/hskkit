// Optional public static-asset origin for the expanded collection. The local
// preview uses same-origin files; no runtime synthesis or Worker API is used.
export function nameAudioUrl(path:string,base=process.env.NEXT_PUBLIC_NAME_AUDIO_BASE_URL??''){
 if(!base||!path.startsWith('/name-audio/v3/'))return path;
 const origin=new URL(base);
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')throw new Error('NEXT_PUBLIC_NAME_AUDIO_BASE_URL must be a public HTTPS origin without a path or credentials.');
 return origin.origin+path;
}
