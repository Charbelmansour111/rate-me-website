/** "{email}" in any text becomes the contact address. */
export type LegalSection = { id: string; title: string; text?: string[]; points?: string[] };
export type LegalDoc = { title: string; description: string; intro: string; sections: LegalSection[] };
export type LegalTexts = { privacy: LegalDoc; terms: LegalDoc };
