import type { Metadata } from 'next';
import './globals.css';
import { RoleNav } from '../components/layout/RoleNav';

export const metadata: Metadata = {
  title: 'Óptica CRM',
  description: 'Pacientes y consultas optométricas',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <RoleNav />
        {children}
      </body>
    </html>
  );
}
