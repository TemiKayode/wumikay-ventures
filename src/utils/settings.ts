export function getSavedLogoUrl(): string {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('wumikay-settings') : null
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.logoUrl) return parsed.logoUrl
      if (parsed && parsed.companyInfo && parsed.companyInfo.logoUrl) return parsed.companyInfo.logoUrl
    }
  } catch (e) {
    // ignore
  }
  return '/logo.png'
}

export function getSavedBrandName(): string {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('wumikay-settings') : null
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.companyInfo && parsed.companyInfo.name) return parsed.companyInfo.name
    }
  } catch (e) {}
  return 'Wumikay Ventures'
}
