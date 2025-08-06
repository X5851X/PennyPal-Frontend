import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  WalletIcon,
  HomeIcon,
  CreditCardIcon,
  BarChart3Icon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  SearchIcon,
  ChevronDownIcon
} from 'lucide-react';
import { authService } from '../services/auth';

const Layout = ({ children, onSearch, searchPlaceholder = "Search transactions, categories..." }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth <= 1024;
      setIsMobile(nowMobile);
      
      if (wasMobile && !nowMobile) {
        setIsSidebarOpen(true);
      }
      if (!wasMobile && nowMobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Get current user
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.signout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Transactions',
      href: '/transaction',
      icon: CreditCardIcon,
      current: location.pathname === '/transaction'
    },
    {
      name: 'Analytics',
      href: '/analytic',
      icon: BarChart3Icon,
      current: location.pathname === '/analytic'
    }
  ];

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
      if (showSearchResults && !event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen, showSearchResults]);

  // Search functionality
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      setShowSearchResults(true);
      
      // Call parent component's search function if provided
      if (onSearch) {
        onSearch(query);
      }
      
      // Simulate search results for demo
      setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      
      // Clear search in parent component
      if (onSearch) {
        onSearch('');
      }
    }
  }, [onSearch]);

  const handleSearchResultClick = useCallback((result) => {
    if (result.type === 'transaction') {
      navigate('/transaction');
    } else if (result.type === 'category') {
      navigate('/transaction');
    } else if (result.type === 'page') {
      navigate('/analytic');
    }
    setShowSearchResults(false);
    setSearchQuery('');
  }, [navigate]);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  }, []);

  const getResultIcon = (type) => {
    switch (type) {
      case 'transaction':
        return CreditCardIcon;
      case 'category':
        return BarChart3Icon;
      case 'page':
        return HomeIcon;
      default:
        return SearchIcon;
    }
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    
    sidebarOverlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 30,
      opacity: (isSidebarOpen && isMobile) ? 1 : 0,
      visibility: (isSidebarOpen && isMobile) ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease, visibility 0.3s ease',
      display: isMobile ? 'block' : 'none'
    },
    
    sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '16rem',
      background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 40,
      overflowY: 'auto',
      boxShadow: '4px 0 25px rgba(0, 0, 0, 0.15)',
      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
      display: 'flex',
      flexDirection: 'column'
    },
    
    sidebarHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      flexShrink: 0
    },
    
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    
    logoIcon: {
      padding: '0.5rem',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '0.5rem',
      backdropFilter: 'blur(10px)'
    },
    
    logoText: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: 'white',
      margin: 0
    },
    
    closeButton: {
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      borderRadius: '0.375rem',
      transition: 'background-color 0.2s ease'
    },
    
    nav: {
      flex: 1,
      padding: '1rem 0',
      minHeight: 0
    },
    
    navSection: {
      marginBottom: '2rem'
    },
    
    navTitle: {
      padding: '0 1.5rem 0.5rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    
    navList: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      borderLeft: '3px solid transparent',
      cursor: 'pointer',
      fontSize: '0.875rem'
    },
    
    navItemActive: {
      background: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
      borderLeftColor: 'white',
      fontWeight: 500
    },
    
    navIcon: {
      width: '1.25rem',
      height: '1.25rem',
      flexShrink: 0
    },
    
    sidebarFooter: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      flexShrink: 0,
      marginTop: 'auto'
    },
    
    userCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '0.5rem',
      backdropFilter: 'blur(10px)'
    },
    
    userAvatar: {
      width: '2rem',
      height: '2rem',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    
    userInfo: {
      flex: 1,
      minWidth: 0
    },
    
    userName: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'white',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    
    userEmail: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.7)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    
    mainContent: {
      flex: 1,
      marginLeft: isSidebarOpen ? '16rem' : 0,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    
    header: {
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    },
    
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      maxWidth: 'none'
    },
    
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    
    menuButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.5rem',
      height: '2.5rem',
      background: 'none',
      border: 'none',
      color: '#64748b',
      cursor: 'pointer',
      borderRadius: '0.375rem',
      transition: 'all 0.2s ease'
    },
    
    searchContainer: {
      display: window.innerWidth <= 640 ? 'none' : 'block',
      position: 'relative',
      width: window.innerWidth <= 768 ? '12rem' : '20rem'
    },
    
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '1rem',
      height: '1rem',
      color: '#9ca3af',
      pointerEvents: 'none'
    },
    
    searchInput: {
      width: '100%',
      padding: '0.5rem 0.75rem 0.5rem 2.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      background: '#f8fafc',
      transition: 'all 0.2s ease',
      outline: 'none'
    },
    
    searchResults: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 50,
      marginTop: '0.25rem',
      maxHeight: '20rem',
      overflowY: 'auto',
      opacity: showSearchResults ? 1 : 0,
      visibility: showSearchResults ? 'visible' : 'hidden',
      transform: `translateY(${showSearchResults ? '0' : '-0.5rem'})`,
      transition: 'all 0.2s ease'
    },
    
    searchResultsHeader: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #e2e8f0',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    
    searchResultItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderLeft: '3px solid transparent'
    },
    
    searchResultIcon: {
      width: '1rem',
      height: '1rem',
      color: '#64748b',
      flexShrink: 0
    },
    
    searchResultContent: {
      flex: 1,
      minWidth: 0
    },
    
    searchResultTitle: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#1e293b',
      marginBottom: '0.125rem'
    },
    
    searchResultDescription: {
      fontSize: '0.75rem',
      color: '#64748b'
    },
    
    searchResultAmount: {
      fontSize: '0.875rem',
      fontWeight: 600
    },
    
    loadingResults: {
      padding: '1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#64748b'
    },
    
    noResults: {
      padding: '1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#64748b'
    },
    
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    
    profileDropdown: {
      position: 'relative'
    },
    
    profileButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.375rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '0.5rem',
      transition: 'background-color 0.2s ease'
    },
    
    profileAvatar: {
      width: '2rem',
      height: '2rem',
      background: '#f1f5f9',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    profileInfo: {
      display: window.innerWidth <= 768 ? 'none' : 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    
    profileName: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#1e293b'
    },
    
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      width: '16rem',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 50,
      marginTop: '0.5rem',
      opacity: isProfileDropdownOpen ? 1 : 0,
      visibility: isProfileDropdownOpen ? 'visible' : 'hidden',
      transform: `translateY(${isProfileDropdownOpen ? '0' : '-0.5rem'})`,
      transition: 'all 0.2s ease'
    },
    
    dropdownHeader: {
      padding: '1rem',
      borderBottom: '1px solid #e2e8f0'
    },
    
    dropdownUserName: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#1e293b',
      marginBottom: '0.25rem'
    },
    
    dropdownUserEmail: {
      fontSize: '0.75rem',
      color: '#64748b'
    },
    
    dropdownDivider: {
      height: '1px',
      background: '#e2e8f0',
      margin: '0.25rem 0'
    },
    
    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      color: '#374151',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'background-color 0.2s ease',
      border: 'none',
      background: 'none',
      width: '100%',
      cursor: 'pointer',
      textAlign: 'left'
    },
    
    logoutItem: {
      color: '#ef4444'
    },
    
    main: {
      flex: 1,
      padding: '1.5rem',
      background: '#f8fafc'
    },
    
    footer: {
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '1rem 1.5rem'
    },
    
    footerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
      gap: window.innerWidth <= 768 ? '0.5rem' : 0
    },
    
    footerText: {
      fontSize: '0.875rem',
      color: '#64748b',
      margin: 0
    },
    
    footerLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    },
    
    footerLink: {
      fontSize: '0.875rem',
      color: '#64748b',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    }
  };

  // Navigation item component
  const NavItem = ({ item }) => {
    const Icon = item.icon;
    
    return (
      <li>
        <a
          href={item.href}
          onClick={(e) => {
            e.preventDefault();
            navigate(item.href);
          }}
          style={{
            ...styles.navItem,
            ...(item.current ? styles.navItemActive : {})
          }}
          onMouseEnter={(e) => {
            if (!item.current) {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = 'white';
              e.target.style.borderLeftColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!item.current) {
              e.target.style.background = 'transparent';
              e.target.style.color = 'rgba(255, 255, 255, 0.8)';
              e.target.style.borderLeftColor = 'transparent';
            }
          }}
        >
          <Icon style={styles.navIcon} />
          <span>{item.name}</span>
        </a>
      </li>
    );
  };

  // Search result item component
  const SearchResultItem = ({ result }) => {
    const Icon = getResultIcon(result.type);
    
    return (
      <div
        style={styles.searchResultItem}
        onClick={() => handleSearchResultClick(result)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.borderLeftColor = '#16a34a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderLeftColor = 'transparent';
        }}
      >
        <Icon style={styles.searchResultIcon} />
        <div style={styles.searchResultContent}>
          <div style={styles.searchResultTitle}>{result.title}</div>
          <div style={styles.searchResultDescription}>{result.description}</div>
        </div>
        {result.amount && (
          <div 
            style={{
              ...styles.searchResultAmount,
              color: result.amount > 0 ? '#16a34a' : '#ef4444'
            }}
          >
            {formatCurrency(result.amount)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Overlay */}
      <div 
        style={styles.sidebarOverlay}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <WalletIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h1 style={styles.logoText}>PennyPal</h1>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={styles.closeButton}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <XIcon style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          <div style={styles.navSection}>
            <div style={styles.navTitle}>Main</div>
            <ul style={styles.navList}>
              {navigationItems.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userCard}>
            <div style={styles.userAvatar}>
              <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.username || user?.name || 'User'}</div>
              <div style={styles.userEmail}>{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={styles.menuButton}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#64748b';
                }}
                title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
              >
                <MenuIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
              
              <div style={styles.searchContainer} className="search-container">
                <SearchIcon style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  style={styles.searchInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#16a34a';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#f8fafc';
                  }}
                />
                
                {/* Search Results */}
                <div style={styles.searchResults}>
                  {isSearching ? (
                    <div style={styles.loadingResults}>
                      Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div style={styles.searchResultsHeader}>
                        Search Results ({searchResults.length})
                      </div>
                      {searchResults.map((result, index) => (
                        <SearchResultItem key={index} result={result} />
                      ))}
                    </>
                  ) : searchQuery.trim() && showSearchResults ? (
                    <div style={styles.noResults}>
                      No results found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div style={styles.headerRight}>
              <div style={styles.profileDropdown} className="profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  style={styles.profileButton}
                  onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                  <div style={styles.profileAvatar}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: '#64748b' }} />
                  </div>
                  <div style={styles.profileInfo}>
                    <span style={styles.profileName}>{user?.username || user?.name || 'User'}</span>
                    <ChevronDownIcon 
                      style={{ 
                        width: '1rem', 
                        height: '1rem', 
                        color: '#9ca3af',
                        transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }} 
                    />
                  </div>
                </button>

                <div style={styles.dropdownMenu}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.dropdownUserName}>{user?.username || user?.name || 'User'}</div>
                    <div style={styles.dropdownUserEmail}>{user?.email || ''}</div>
                  </div>
                  
                  <div style={styles.dropdownDivider} />
                  
                  <a 
                    href="/profile" 
                    style={styles.dropdownItem}
                    onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/profile');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <UserIcon style={{ width: '1rem', height: '1rem' }} />
                    Profile Settings
                  </a>
                  
                  <div style={styles.dropdownDivider} />
                  
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsProfileDropdownOpen(false);
                    }}
                    style={{...styles.dropdownItem, ...styles.logoutItem}}
                    onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    <LogOutIcon style={{ width: '1rem', height: '1rem' }} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={styles.main}>
          {children}
        </main>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerContent}>
            <p style={styles.footerText}>
              © 2025 PennyPal. All rights reserved.
            </p>
            <div style={styles.footerLinks}>
              <a 
                href="/privacy" 
                style={styles.footerLink}
                onMouseEnter={(e) => e.target.style.color = '#16a34a'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/privacy');
                }}
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                style={styles.footerLink}
                onMouseEnter={(e) => e.target.style.color = '#16a34a'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/terms');
                }}
              >
                Terms of Service
              </a>
              <a 
                href="/support" 
                style={styles.footerLink}
                onMouseEnter={(e) => e.target.style.color = '#16a34a'}
                onMouseLeave={(e) => e.target.style.color = '#64748b'}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/support');
                }}
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;