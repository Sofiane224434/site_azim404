// layouts/AuthLayout.jsx
import { Link, Outlet } from 'react-router-dom';

function AuthLayout() {
    return (
        <div>
            <div className="p-4">
                <Link to="/" className="text-indigo-500 hover:underline text-sm">
                    ← Accueil
                </Link>
            </div>
            <Outlet />
        </div>
    );
}
export default AuthLayout;
