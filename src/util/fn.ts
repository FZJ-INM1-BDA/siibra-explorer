export function isSame (o, n) {
  if (!o) return !n
  return o === n || (o && n && o.name === n.name)
}