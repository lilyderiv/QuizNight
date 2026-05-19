// =====================================================================
// useSounds.js — Tüm oyun seslerini yöneten özel hook
// Bu hook, click, doğru cevap ve yanlış cevap seslerini çalar.
// Ayarlar ekranındaki ses seviyesi ve susturma state'lerini prop olarak alır.
// =====================================================================

import { useRef, useCallback } from "react";

export default function useSounds(soundVolume, isSoundMuted) {
  
  // Her ses için ayrı bir referans (ref) oluşturuyoruz.
  // useRef ile oluşturulan ses nesneleri, component yeniden render olsa bile sıfırlanmaz.
  const clickSoundRef = useRef(new Audio("/sounds/click.mp3"));
  const trueSoundRef  = useRef(new Audio("/sounds/true1.mp3"));
  const falseSoundRef = useRef(new Audio("/sounds/false1.mp3"));

  // Herhangi bir sesi çalmak için kullandığımız yardımcı fonksiyon.
  // useCallback ile sarmaladık, böylece gereksiz yere yeniden oluşturulmaz.
  const playSound = useCallback((audioRef) => {
    // Ses susturulmuşsa hiçbir şey yapma
    if (isSoundMuted) return;

    // Sesi başa sar (aynı ses üst üste çalınabilsin diye)
    audioRef.current.currentTime = 0;

    // Ayarlar ekranındaki ses seviyesini uygula (0-100 arası değeri 0.0-1.0'a çevirir)
    audioRef.current.volume = soundVolume / 100;

    // Sesi çal
    audioRef.current.play().catch((e) => 
      console.log("Ses çalınamadı:", e)
    );
  }, [isSoundMuted, soundVolume]);

  // Dışarıya açılan 3 fonksiyon:
  // playClick  → Butona basılınca çağrılır
  // playTrue   → Doğru cevap seçilince çağrılır
  // playFalse  → Yanlış cevap seçilince çağrılır
  const playClick = useCallback(() => playSound(clickSoundRef), [playSound]);
  const playTrue  = useCallback(() => playSound(trueSoundRef),  [playSound]);
  const playFalse = useCallback(() => playSound(falseSoundRef), [playSound]);

  return { playClick, playTrue, playFalse };
}