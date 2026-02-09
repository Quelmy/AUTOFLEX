import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Calculator,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Matérias-Primas', href: '/raw-materials', icon: Boxes },
  { name: 'Produção', href: '/production', icon: Calculator },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-primary">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <Factory className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Autoflex</h1>
            <p className="text-xs text-sidebar-foreground/70">Gestão de Estoque</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn('nav-item', isActive && 'nav-item-active')}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60 text-center">
            Sistema de Controle de Estoque
          </p>
        </div>
      </div>
    </aside>
  );
}
