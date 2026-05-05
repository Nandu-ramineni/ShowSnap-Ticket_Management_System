import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const StatCard = ({ label, value, icon }) => (
  <div style={{
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: '14px', padding: '20px 22px',
    display: 'flex', alignItems: 'center', gap: '16px',
  }}>
    <div style={{ fontSize: '26px', lineHeight: 1 }}>{icon}</div>
    <div>
      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(240,242,255,.45)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#f0f2ff' }}>{value}</p>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
    <span style={{ fontSize: '13px', color: 'rgba(240,242,255,.45)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '13px', color: '#f0f2ff', fontWeight: 600 }}>{value}</span>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .dash-card { animation:fadeUp .4s cubic-bezier(.16,1,.3,1) both; }
                .dash-card:nth-child(2){animation-delay:.05s}
                .dash-card:nth-child(3){animation-delay:.1s}
                .logout-btn:hover{background:rgba(248,113,113,.15)!important;border-color:rgba(248,113,113,.4)!important;color:#f87171!important}
                @media(max-width:640px){.dash-grid{grid-template-columns:1fr!important}}
            `}</style>
      <div style={{
        minHeight: '100vh', background: '#0c0f1a',
        fontFamily: '"Geist Variable","Inter Variable",system-ui,sans-serif',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle,rgba(232,67,147,.08) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-15%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle,rgba(124,58,237,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Navbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(12,15,26,.85)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          padding: '0 24px',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#e84393,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🎫</div>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#f0f2ff', letterSpacing: '-.01em' }}>SeatSecure</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#e84393,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(240,242,255,.7)', display: 'inline-block', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
              <button
                className="logout-btn"
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)',
                  borderRadius: '8px', padding: '6px 14px', color: 'rgba(240,242,255,.6)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px', position: 'relative', zIndex: 1 }}>
          {/* Welcome banner */}
          <div className="dash-card" style={{
            background: 'linear-gradient(135deg,rgba(232,67,147,.15),rgba(124,58,237,.15))',
            border: '1px solid rgba(232,67,147,.2)',
            borderRadius: '16px', padding: '28px 32px', marginBottom: '28px',
          }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f0f2ff', letterSpacing: '-.02em' }}>
              Welcome back, {user?.name?.split(' ')[0] ?? 'there'} 👋
            </h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(240,242,255,.55)', fontSize: '14px' }}>
              Here's what's happening with your account today.
            </p>
          </div>

          {/* Stats grid */}
          <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Loyalty Points" value={user?.loyaltyPoints ?? 0} icon="⭐" />
            <StatCard label="Account Status" value={user?.accountStatus === 'active' ? 'Active' : user?.accountStatus ?? '—'} icon="✅" />
            <StatCard label="Verified" value={user?.isVerified ? 'Yes' : 'Pending'} icon={user?.isVerified ? '🔐' : '⏳'} />
          </div>

          {/* Profile card */}
          <div className="dash-card" style={{
            background: 'rgba(19,23,38,1)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: '16px', padding: '28px 28px',
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: '#f0f2ff', letterSpacing: '-.01em' }}>
              Account Information
            </h3>
            <InfoRow label="User ID" value={user?.id ?? '—'} />
            <InfoRow label="Full Name" value={user?.name ?? '—'} />
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Phone" value={user?.phone ?? '—'} />
            <InfoRow label="Role" value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—'} />
            <div style={{ paddingTop: '12px' }}>
              <InfoRow label="Member Since" value={new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
