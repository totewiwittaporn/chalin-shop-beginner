export function thBahtText(n) {
// Placeholder: return formatted THB amount; replace with real Thai reading
const formatter = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
return formatter.format(n)
}