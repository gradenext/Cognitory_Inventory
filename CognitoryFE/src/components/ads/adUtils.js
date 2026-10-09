export const AD_TYPES = [
  { id: "image", label: "Image", hint: "A banner image, with optional text and button on top" },
  { id: "video", label: "Video", hint: "An MP4 that autoplays muted, with optional text and button" },
  { id: "offer", label: "Offer / Discount", hint: "Discount, coupon code and valid-till date" },
  { id: "announcement", label: "Announcement", hint: "Headline, selling points and a big emoji on a coloured background" },
];

// Keep in sync with AD_THEMES in GradeNext_frontend src/components/dashboard/AdSlide.jsx
// bg: layered glow + base gradient · accent: tag / discount colour · ink: button text
export const AD_THEMES = {
  violet: {
    bg: "radial-gradient(circle at 88% 8%, rgba(167,139,250,0.9) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(26,171,133,0.75) 0%, transparent 48%), linear-gradient(160deg, #5b3fd6 0%, #2e1f7a 100%)",
    accent: "#ffd97a", ink: "#3a278f",
  },
  blue: {
    bg: "radial-gradient(circle at 90% 5%, rgba(34,211,238,0.85) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(99,102,241,0.9) 0%, transparent 50%), linear-gradient(160deg, #0ea5e9 0%, #1d4ed8 100%)",
    accent: "#fde047", ink: "#1e40af",
  },
  rose: {
    bg: "radial-gradient(circle at 95% 0%, rgba(251,146,60,0.95) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(126,34,206,0.85) 0%, transparent 50%), linear-gradient(160deg, #f43f5e 0%, #be185d 100%)",
    accent: "#fef08a", ink: "#9d174d",
  },
  emerald: {
    bg: "radial-gradient(circle at 90% 5%, rgba(163,230,53,0.7) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(14,116,144,0.9) 0%, transparent 50%), linear-gradient(160deg, #10b981 0%, #0f766e 100%)",
    accent: "#fef08a", ink: "#065f46",
  },
  amber: {
    bg: "radial-gradient(circle at 92% 5%, rgba(253,224,71,0.9) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(220,38,38,0.75) 0%, transparent 50%), linear-gradient(160deg, #f59e0b 0%, #ea580c 100%)",
    accent: "#ffffff", ink: "#9a3412",
  },
  slate: {
    bg: "radial-gradient(circle at 88% 8%, rgba(124,58,237,0.85) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(14,165,233,0.6) 0%, transparent 48%), linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)",
    accent: "#5eead4", ink: "#1e1b4b",
  },
};

export const MEDIA_RULES = {
  image: { accept: ".jpg,.jpeg,.png,.gif,.webp", maxMb: 5, label: "JPG, PNG, GIF or WEBP · up to 5MB" },
  video: { accept: ".mp4", maxMb: 50, label: "MP4 · up to 50MB · keep it under 30 seconds" },
};

export const RECOMMENDED_SIZE = "1080 × 1350 px (4:5 portrait). Keep the subject in the upper half: text covers the lower part and edges may be cropped.";

export const emptyAd = () => ({
  name: "",
  type: "image",
  tag: "",
  headline: "",
  subtext: "",
  emoji: "",
  highlights: ["", "", ""],
  offer: { discountText: "", couponCode: "", validTill: "" },
  cta: { label: "", url: "" },
  theme: "violet",
  order: 0,
  startAt: "",
  endAt: "",
});

const pad = (n) => String(n).padStart(2, "0");

// ISO string -> value for <input type="datetime-local">
export const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toIso = (localValue) => (localValue ? new Date(localValue).toISOString() : null);

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

// Where a published ad stands against its schedule right now
export const liveState = (ad) => {
  if (ad.status !== "published") return ad.status;
  const now = new Date();
  if (ad.startAt && new Date(ad.startAt) > now) return "scheduled";
  if (ad.endAt && new Date(ad.endAt) <= now) return "ended";
  return "live";
};

export const EMOJI_PICKS = ["🚀", "🎉", "🏆", "🧩", "💻", "🤖", "📚", "🔬", "🎁", "⚡", "🎓", "👩‍🏫"];
