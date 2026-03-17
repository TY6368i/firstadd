export function randomInt(minInclusive: number, maxInclusive: number) {
  const min = Math.ceil(minInclusive)
  const max = Math.floor(maxInclusive)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pickOne<T>(arr: readonly T[]) {
  return arr[randomInt(0, arr.length - 1)]
}

export function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

