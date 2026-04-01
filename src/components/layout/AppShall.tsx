export default function AppShell({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main className="page">
      <div className="container-app">
        {children}
      </div>
    </main>
  )
}

