export default function Button({ variant = 'primary', className = '', ...props }) {
  const base = 'btn ' + (variant === 'primary' ? 'btn-primary' : 'btn-outline');
  return <button className={`${base} ${className}`} {...props} />;
}
