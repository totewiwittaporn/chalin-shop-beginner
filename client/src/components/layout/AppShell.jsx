export default function AppShell({ sidebar, children }) {
  return (
    <div className="container-app py-6">
      <div>{children}</div>
    </div>
  );
}
