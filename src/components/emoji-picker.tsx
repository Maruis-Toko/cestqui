"use client"

import { cx } from "@/lib/cx"

export const EMOJIS = ["😎", "🤓", "😈", "🦊", "🐼", "🦁", "🐸", "🐙", "🦄", "🔥", "⚡", "🍀", "🎭", "👻", "🤖", "🌶️"]

export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-2" role="group" aria-label="Emoji">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          aria-pressed={value === e}
          onClick={() => onChange(e)}
          className={cx(
            "aspect-square rounded-xl border text-2xl transition active:scale-95",
            value === e ? "border-accent bg-card-2" : "border-line bg-card"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
