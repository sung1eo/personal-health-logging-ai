export const BODY_PARTS = ["머리", "목", "가슴", "복부", "등", "허리", "팔", "다리", "전신", "기타"] as const;
export type BodyPart = (typeof BODY_PARTS)[number];

export const BODY_PART_ICONS: Record<BodyPart, string> = {
  머리: "🧠",
  목: "🫁",
  가슴: "❤️",
  복부: "🫃",
  등: "🔙",
  허리: "🦴",
  팔: "💪",
  다리: "🦵",
  전신: "🧍",
  기타: "🩹",
};
