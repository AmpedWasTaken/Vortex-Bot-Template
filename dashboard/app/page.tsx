export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p style={{ letterSpacing: '0.35em', textTransform: 'uppercase', color: '#38bdf8', fontSize: '0.75rem' }}>
        Vortex Bot Template
      </p>
      <h1 style={{ fontSize: '2.25rem', margin: 0 }}>Dashboard scaffold</h1>
      <p style={{ maxWidth: '40rem', color: '#94a3b8', lineHeight: 1.6 }}>
        Wire this Next.js app to your bot API, billing provider, and guild analytics. The core Discord runtime lives in
        the root package — this folder is an optional control plane starter.
      </p>
    </main>
  );
}
