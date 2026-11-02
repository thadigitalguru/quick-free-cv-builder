import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

/**
 * The app has two routes, so it uses this small history router instead of react-router, which
 * added 12 kB (gzip) to every first visit. It keeps react-router's API for the parts in use.
 */
type NavigateOptions = { replace?: boolean };
type Navigate = (to: string, options?: NavigateOptions) => void;

const RouterContext = createContext<{ path: string; navigate: Navigate } | null>(null);

// Like react-router: case-insensitive, and "/builder/" matches "/builder".
const normalise = (path: string) => (path.replace(/\/+$/, '') || '/').toLowerCase();

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = useCallback<Navigate>((to, options) => {
    const url = new URL(to, window.location.href);
    if (options?.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setPath(url.pathname);
  }, []);
  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

const useRouter = () => {
  const router = useContext(RouterContext);
  if (!router) throw new Error('Router hooks must be used inside <BrowserRouter>.');
  return router;
};

export const useNavigate = () => useRouter().navigate;

type RouteProps = { path: string; element: ReactNode };

/** Declares a route; <Routes> reads its props and renders the element. */
export const Route: (props: RouteProps) => null = () => null;

/** Renders the first <Route> whose path matches, with "*" as the catch-all. */
export function Routes({ children }: { children: ReactNode }) {
  const current = normalise(useRouter().path);
  const routes = Children.toArray(children).filter((child) => isValidElement<RouteProps>(child)).map((child) => child.props);
  const match = routes.find((route) => route.path !== '*' && normalise(route.path) === current) ?? routes.find((route) => route.path === '*');
  return <>{match?.element ?? null}</>;
}

export function Navigate({ to, replace }: { to: string } & NavigateOptions) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace }), [navigate, to, replace]);
  return null;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** An <a> that navigates in-app for same-origin links; new-tab, modified and external clicks act normally. */
export function Link({ to, onClick, target, ...rest }: LinkProps) {
  const navigate = useNavigate();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (target && target !== '_self') return;
    if (new URL(to, window.location.href).origin !== window.location.origin) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} target={target} onClick={handleClick} {...rest} />;
}
