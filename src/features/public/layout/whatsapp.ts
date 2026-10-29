import { buildWhatsAppLink } from '@/lib/whatsapp';
export function whatsappUrl(number:string,message:string):string|null{return buildWhatsAppLink({phone:number,message})}
