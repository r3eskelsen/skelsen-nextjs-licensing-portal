declare module '@/lib/import-policy.mjs' {
  export function validateCsv(text: string, organizationId: string): Array<{organization_id:string;name:string;expires_on:string}>;
}
