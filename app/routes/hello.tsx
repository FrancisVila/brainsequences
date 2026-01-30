export default function Hello() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#4a5568' }}>Hello World! 🌍</h1>
      <p style={{ fontSize: '1.2rem', color: '#2d3748' }}>
        If you can see this on Vercel, the basic routing works!
      </p>
      <p style={{ color: '#718096', marginTop: '1rem' }}>
        Timestamp: {new Date().toISOString()}
      </p>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f7fafc', 
        borderLeft: '4px solid #4299e1',
        borderRadius: '4px'
      }}>
        <h2 style={{ marginTop: 0, color: '#2c5282' }}>Deployment Test Status</h2>
        <ul style={{ color: '#4a5568' }}>
          <li>✅ React Router rendering</li>
          <li>✅ TypeScript compilation</li>
          <li>✅ Basic route serving</li>
        </ul>
        <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: 0 }}>
          Next step: If this works, gradually restore routes from routes.ts.backup
        </p>
      </div>
    </div>
  );
}
