import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "./common/ThemeToggleButton";
import NotificationDropdown from "./header/NotificationDropdown";
import UserDropdown from "./header/UserDropdown";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get user info from localStorage
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                className="h-8 w-auto dark:hidden"
                src="/images/logo/logo.svg"
                alt="TailAdmin"
              />
              <img
                className="hidden h-8 w-auto dark:block"
                src="/images/logo/logo-dark.svg"
                alt="TailAdmin"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-1">
            {/* Public Menu */}
            <Link
              to="/marketplace"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive("/marketplace")
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Marketplace
            </Link>

            <Link
              to="/budaya"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive("/budaya")
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Konten Budaya
            </Link>

            {/* Admin Menu */}
            {token && userType === "admin" && (
              <>
                <Link
                  to="/admin/list"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/admin/list")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Admin
                </Link>

                <Link
                  to="/pengguna/list"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/pengguna/list")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Pengguna
                </Link>

                <Link
                  to="/kategori/list"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/kategori/list")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Kategori
                </Link>

                <Link
                  to="/profile-usaha/verifikasi"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/profile-usaha/verifikasi")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Verifikasi Usaha
                </Link>

                <Link
                  to="/konten-budaya"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/konten-budaya")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Kelola Konten
                </Link>
              </>
            )}

            {/* Pengguna Menu */}
            {token && userType === "pengguna" && (
              <>
                <Link
                  to="/produk/list"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/produk/list")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Produk
                </Link>

                <Link
                  to="/profile"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/profile")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Profil
                </Link>

                <Link
                  to="/profile-usaha"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/profile-usaha")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Profile Usaha
                </Link>

                <Link
                  to="/alamat"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/alamat")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Alamat
                </Link>

                <Link
                  to="/notifikasi"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/notifikasi")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Notifikasi
                </Link>

                <Link
                  to="/konten-budaya"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive("/konten-budaya")
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  Konten Saya
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden lg:block">
              <form>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="fill-gray-500 dark:fill-gray-400"
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    className="h-10 w-64 rounded-lg border border-gray-200 bg-transparent py-2 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </form>
            </div>

            <ThemeToggleButton />

            {token && <NotificationDropdown />}

            {!token ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register-pengguna"
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 transition-colors dark:text-gray-900"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <UserDropdown />
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6H21M3 12H21M3 18H21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col gap-1">
              <Link
                to="/marketplace"
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive("/marketplace")
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Marketplace
              </Link>

              <Link
                to="/budaya"
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive("/budaya")
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Konten Budaya
              </Link>

              {token && userType === "admin" && (
                <>
                  <Link
                    to="/admin/list"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/admin/list")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link
                    to="/pengguna/list"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/pengguna/list")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pengguna
                  </Link>
                  <Link
                    to="/kategori/list"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/kategori/list")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kategori
                  </Link>
                  <Link
                    to="/profile-usaha/verifikasi"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/profile-usaha/verifikasi")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Verifikasi Usaha
                  </Link>
                  <Link
                    to="/konten-budaya"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/konten-budaya")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kelola Konten
                  </Link>
                </>
              )}

              {token && userType === "pengguna" && (
                <>
                  <Link
                    to="/produk/list"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/produk/list")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Produk
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/profile")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <Link
                    to="/profile-usaha"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/profile-usaha")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile Usaha
                  </Link>
                  <Link
                    to="/alamat"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/alamat")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Alamat
                  </Link>
                  <Link
                    to="/notifikasi"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/notifikasi")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Notifikasi
                  </Link>
                  <Link
                    to="/konten-budaya"
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive("/konten-budaya")
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Konten Saya
                  </Link>
                </>
              )}

              {!token && (
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-center text-white bg-green-600 rounded-lg hover:bg-green-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register-pengguna"
                    className="px-4 py-2 text-sm font-medium text-center text-gray-900 bg-yellow-400 rounded-lg hover:bg-yellow-500"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}

              {token && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;