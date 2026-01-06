import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileNav from './MobileNav';

export default function Layout() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <MobileNav />
    </>
  );
}
