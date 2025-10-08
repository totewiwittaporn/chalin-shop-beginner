export default function Badge({ children, tone = 'default' }) {
const tones = {
default: 'bg-accent text-text',
success: 'bg-green-200 text-green-900',
warn: 'bg-yellow-200 text-yellow-900',
danger: 'bg-red-200 text-red-900'
};
return <span className={`inline-flex px-2 py-0.5 rounded-xl text-xs ${tones[tone] || tones.default}`}>{children}</span>;
}