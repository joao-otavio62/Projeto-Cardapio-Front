let ctx: AudioContext | null = null
const get = () => (ctx ??= new AudioContext())

/** Navegadores só liberam áudio após um gesto do usuário: chame após o primeiro clique/login. */
export function unlockAudio() { try { void get().resume() } catch { /* sem áudio */ } }

export function playNotification() {
  try {
    const c = get()
    void c.resume()
    ;[0, 0.22].forEach((delay, i) => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.value = i ? 1100 : 880
      o.connect(g); g.connect(c.destination)
      const t = c.currentTime + delay
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      o.start(t); o.stop(t + 0.4)
    })
  } catch { /* sem áudio */ }
}
