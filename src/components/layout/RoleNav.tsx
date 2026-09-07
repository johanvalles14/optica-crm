'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import {
  Banknote,
  ClipboardList,
  Glasses,
  LogOut,
  Microscope,
  Package,
  ReceiptText,
  Search,
  Settings,
  Tags,
} from 'lucide-react';

export const ROLES = [
  { id: 'clinical:optometrist', label: 'Optometrista', initials: 'OP' },
  { id: 'frontdesk:receptionist', label: 'Mostrador / Recepción', initials: 'MO' },
  { id: 'laboratory:technician', label: 'Técnico de Taller', initials: 'TL' },
  { id: 'inventory:manager', label: 'Inventario', initials: 'IN' },
  { id: 'clinical:assistant', label: 'Asistente Clínico', initials: 'AS' },
  { id: 'admin', label: 'Administrador', initials: 'AD' },
] as const;

export function RoleNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeRole, setActiveRole] = useState('clinical:optometrist');
  const [searchQuery, setSearchQuery] = useState('');
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const moreRef = useRef<HTMLLIElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('demo-role');
    if (saved) setActiveRole(saved);

    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleRoleChange(newRole: string) {
    setActiveRole(newRole);
    localStorage.setItem('demo-role', newRole);
    window.dispatchEvent(new Event('role-change'));
  }

  function handleGlobalSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (/^vta-/i.test(q)) {
      router.push(`/sales/orders`);
    } else {
      router.push(`/patients/search?query=${encodeURIComponent(q)}`);
    }
  }

  const currentRoleObj = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  const isMoreActive =
    pathname?.startsWith('/consultations') ||
    pathname?.startsWith('/inventory') ||
    pathname?.startsWith('/laboratory') ||
    pathname?.startsWith('/cash') ||
    pathname?.startsWith('/billing') ||
    pathname?.startsWith('/frontdesk');

  return (
    <nav className="site-nav" aria-label="Navegación principal">
      <div className="nav-container">
        {/* Izquierda: Marca y Navegación principal */}
        <div className="nav-left">
          <Link href="/" className="brand">
            <div className="brand-icon">
              <Glasses size={18} aria-hidden="true" />
            </div>
            <div>
              <span className="logo">
                ÓPTICA <span>CRM</span>
              </span>
            </div>
            <span className="branch-badge">Matriz</span>
          </Link>

          <ul className="nav-links">
            <li>
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/patients/search"
                className={`nav-link ${pathname?.startsWith('/patients') ? 'active' : ''}`}
              >
                Pacientes
              </Link>
            </li>
            <li>
              <Link
                href="/sales/pos"
                className={`nav-link ${pathname === '/sales/pos' ? 'active' : ''}`}
              >
                Ventas
              </Link>
            </li>
            <li>
              <Link
                href="/sales/orders"
                className={`nav-link ${pathname === '/sales/orders' ? 'active' : ''}`}
              >
                Pedidos
              </Link>
            </li>

            {/* Menú Más */}
            <li className="nav-dropdown" ref={moreRef}>
              <button
                type="button"
                className={`nav-link ${isMoreActive ? 'active' : ''}`}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-expanded={moreMenuOpen}
                style={{ background: isMoreActive ? 'var(--accent-light)' : 'transparent', border: 0, cursor: 'pointer' }}
              >
                Más ▾
              </button>

              {moreMenuOpen && (
                <div className="dropdown-menu">
                  <Link
                    href="/consultations"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <Microscope size={16} aria-hidden="true" />
                    </span>
                    Gabinete / Consultas
                  </Link>
                  <Link
                    href="/frontdesk/summary"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <ClipboardList size={16} aria-hidden="true" />
                    </span>
                    Mostrador Clínico
                  </Link>
                  <Link
                    href="/inventory/products"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <Package size={16} aria-hidden="true" />
                    </span>
                    Inventario & Stock
                  </Link>
                  <Link
                    href="/inventory/intake"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <Tags size={16} aria-hidden="true" />
                    </span>
                    Alta Rápida de Lote
                  </Link>
                  <Link
                    href="/laboratory/kanban"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <Settings size={16} aria-hidden="true" />
                    </span>
                    Taller de Biselado
                  </Link>
                  <div className="dropdown-divider" />
                  <Link
                    href="/cash/shift"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <Banknote size={16} aria-hidden="true" />
                    </span>
                    Caja & Turnos
                  </Link>
                  <Link
                    href="/billing/invoices"
                    className="dropdown-item"
                    onClick={() => setMoreMenuOpen(false)}
                  >
                    <span>
                      <ReceiptText size={16} aria-hidden="true" />
                    </span>
                    Facturación SAT
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </div>

        {/* Centro: Buscador Unificado */}
        <div className="nav-center">
          <form className="nav-search-form" onSubmit={handleGlobalSearch}>
            <span className="nav-search-icon">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              type="search"
              className="nav-search-input"
              placeholder="Buscar paciente, teléfono o folio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar expediente o pedido"
            />
          </form>
        </div>

        {/* Derecha: Perfil Discreto y Control de Rol */}
        <div className="nav-right" ref={profileRef}>
          <div className="nav-dropdown">
            <button
              type="button"
              className="profile-pill"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-expanded={profileMenuOpen}
            >
              <div className="avatar-badge">{currentRoleObj.initials}</div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                {currentRoleObj.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--subtle)' }}>▾</span>
            </button>

            {profileMenuOpen && (
              <div className="dropdown-menu" style={{ width: '260px' }}>
                <div style={{ padding: '8px 12px' }}>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Usuario en Turno
                  </span>
                  <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                    Personal Óptica
                  </strong>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>
                    Sucursal PT-001 (Matriz)
                  </span>
                </div>

                <div className="dropdown-divider" />

                <div style={{ padding: '8px 12px' }}>
                  <label htmlFor="role-select" style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                    CAMBIAR ROL (MODO DEMO):
                  </label>
                  <select
                    id="role-select"
                    value={activeRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    style={{ fontSize: '12px', padding: '6px 8px', minHeight: '34px' }}
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="dropdown-divider" />

                <Link
                  href="/login"
                  className="dropdown-item"
                  onClick={() => setProfileMenuOpen(false)}
                  style={{ color: 'var(--danger)' }}
                >
                  <span><LogOut size={16} aria-hidden="true" /></span> Cerrar sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
