'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export const ROLES = [
  { id: 'clinical:optometrist', label: 'Optometrista (Gabinete)' },
  { id: 'frontdesk:receptionist', label: 'Secretaría (Mostrador)' },
  { id: 'laboratory:technician', label: 'Técnico de Taller / Montador' },
  { id: 'inventory:manager', label: 'Encargado de Inventario' },
  { id: 'clinical:assistant', label: 'Asistente' },
  { id: 'admin', label: 'Administrador' },
] as const;

export function RoleNav() {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState('clinical:optometrist');

  useEffect(() => {
    const saved = localStorage.getItem('demo-role');
    if (saved) setActiveRole(saved);
  }, []);

  function handleRoleChange(newRole: string) {
    setActiveRole(newRole);
    localStorage.setItem('demo-role', newRole);
    window.dispatchEvent(new Event('role-change'));
  }

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <div className="nav-container">
        <div className="brand">
          <Link href="/" className="logo">
            ÓPTICA <span>CRM</span>
          </Link>
          <span className="spec-tag">SPEC-001..005</span>
        </div>

        <ul className="nav-links">
          <li>
            <Link href="/" className={pathname === '/' ? 'active' : ''}>
              Inicio
            </Link>
          </li>
          <li>
            <Link href="/patients/new" className={pathname === '/patients/new' ? 'active' : ''}>
              Nuevo Paciente
            </Link>
          </li>
          <li>
            <Link href="/patients/search" className={pathname === '/patients/search' ? 'active' : ''}>
              Buscar
            </Link>
          </li>
          <li>
            <Link
              href="/frontdesk/summary"
              className={pathname?.startsWith('/frontdesk') ? 'active' : ''}
            >
              Mostrador
            </Link>
          </li>
          <li>
            <Link
              href="/sales/pos"
              className={pathname === '/sales/pos' ? 'active' : ''}
            >
              Punto de Venta
            </Link>
          </li>
          <li>
            <Link
              href="/sales/orders"
              className={pathname === '/sales/orders' ? 'active' : ''}
            >
              Pedidos
            </Link>
          </li>
          <li>
            <Link
              href="/billing/invoices"
              className={pathname?.startsWith('/billing') ? 'active' : ''}
            >
              Facturas
            </Link>
          </li>
          <li>
            <Link
              href="/cash/shift"
              className={pathname?.startsWith('/cash') ? 'active' : ''}
            >
              Caja
            </Link>
          </li>
          <li>
            <Link
              href="/laboratory/kanban"
              className={pathname?.startsWith('/laboratory') ? 'active' : ''}
            >
              Taller
            </Link>
          </li>
          <li>
            <Link
              href="/inventory/intake"
              className={pathname === '/inventory/intake' ? 'active' : ''}
            >
              Alta Lote
            </Link>
          </li>
          <li>
            <Link
              href="/inventory/products"
              className={pathname === '/inventory/products' ? 'active' : ''}
            >
              Stock
            </Link>
          </li>
          <li>
            <Link
              href="/consultations/consultation-001"
              className={pathname?.startsWith('/consultations') ? 'active' : ''}
            >
              Gabinete
            </Link>
          </li>
        </ul>

        <div className="role-selector">
          <label htmlFor="role-select" className="role-label">
            Rol actual:
          </label>
          <select
            id="role-select"
            value={activeRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="role-dropdown"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
