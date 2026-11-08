import './style.css';
export const metadata = { title: 'Eskelsen Licensing Lab', description: 'Independent multitenant licensing demonstration' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><header><strong>ESKELSEN <span>SYSTEMS</span></strong><small>LICENSING LAB · Independent demonstration</small></header><main>{children}</main><footer>Synthetic data only · Not production certified · MIT License</footer></body></html>;
}
