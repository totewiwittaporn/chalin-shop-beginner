export default function AppShell({ sidebar, children }) {
return (
<div className="container-app py-6 grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-6">
{sidebar}
<div className="grid gap-6">{children}</div>
</div>
);
}