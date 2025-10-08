import { Card } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <section>
        <h2 className="h-title mb-3">Appearance</h2>
        <Card className="p-4">
          <div className="rounded-2xl overflow-hidden shadow-soft border border-border bg-surface">
            <img
              src="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1400&auto=format&fit=crop"
              alt="Scenic"
              className="w-full h-[220px] object-cover"
            />
          </div>
          <p className="text-center text-sm text-muted mt-3">รูปภาพโดย Péter Hegedüs</p>
          <div className="mt-4 flex justify-center">
            <Button className="min-w-[220px]">Change theme</Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
