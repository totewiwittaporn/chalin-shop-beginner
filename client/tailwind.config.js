/** @type {import('tailwindcss').Config} */
export default {
content: ['./index.html', './src/**/*.{js,jsx}'],
theme: {
extend: {
colors: {
bg: 'var(--color-bg)',
surface: 'var(--color-surface)',
border: 'var(--color-border)',
text: 'var(--color-text)',
muted: 'var(--color-muted)',
primary: 'var(--color-primary)',
primaryStrong: 'var(--color-primary-strong)',
primaryFg: 'var(--color-primary-fg)',
accent: 'var(--color-accent)'
},
borderRadius: {
xl: 'var(--radius-xl)',
'2xl': 'var(--radius-2xl)'
},
boxShadow: {
soft: 'var(--shadow-soft)'
}
}
},
plugins: []
};