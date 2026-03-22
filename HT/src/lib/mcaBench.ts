/**
 * MCA-Bench 데이터셋 메타데이터 및 유틸리티
 * Kaggle: luffy798/mca-benchmultimodal-captchas
 */

export type MCACategory = {
  key: string
  name: string
  label: string
  count: number
  total: number
  files?: string[]
}

export type MCAManifest = {
  categories: MCACategory[]
}

const CAPTCHA_DATA_BASE = "/captcha-data"

export function getImageUrl(categoryKey: string, filename: string): string {
  return `${CAPTCHA_DATA_BASE}/${categoryKey}/${filename}`
}

export function getManifestUrl(): string {
  return `${CAPTCHA_DATA_BASE}/manifest.json`
}

export async function fetchMCAManifest(): Promise<MCAManifest | null> {
  try {
    const res = await fetch(getManifestUrl())
    if (!res.ok) return null
    return (await res.json()) as MCAManifest
  } catch {
    return null
  }
}

export function getCategoryImageUrls(categoryKey: string, files: string[]): string[] {
  const base = `${CAPTCHA_DATA_BASE}/${categoryKey}`
  return files.map((f) => `${base}/${f}`)
}
