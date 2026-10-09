import { ArrowRight, Check, Clock, Copy } from "lucide-react";
import { AD_THEMES } from "./adUtils";

const DOTS_BG = {
  backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1.2px, transparent 1.2px)",
  backgroundSize: "16px 16px",
  maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 65%)",
  WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 65%)",
};

const endsIn = (validTill) => {
  if (!validTill) return "";
  const days = Math.ceil((new Date(validTill) - new Date()) / 86400000);
  if (days <= 0) return "";
  if (days === 1) return "Ends today";
  if (days <= 30) return `Ends in ${days} days`;
  return `Till ${new Date(validTill).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

/**
 * Shows an ad the way the GradeNext dashboard draws it.
 * Keep the markup in sync with GradeNext_frontend src/components/dashboard/AdSlide.jsx.
 */
const AdPreview = ({ ad, mediaUrl, mediaKind, className = "" }) => {
  const theme = AD_THEMES[ad.theme] || AD_THEMES.violet;
  const isOffer = ad.type === "offer";
  const isVideo = !!mediaUrl && mediaKind === "video";
  const discount = isOffer ? ad.offer?.discountText : "";
  const coupon = isOffer ? ad.offer?.couponCode : "";
  const deadline = isOffer ? endsIn(ad.offer?.validTill) : "";
  const highlights = (ad.highlights || []).filter(Boolean);
  const hasText = ad.headline || ad.subtext || discount || coupon || ad.cta?.label || highlights.length > 0;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-md flex flex-col px-5 pt-4 pb-8 ${className}`}
      style={{ background: mediaUrl ? "#0f172a" : theme.bg, containerType: "inline-size" }}
    >
      {isVideo && <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />}
      {mediaUrl && !isVideo && <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {mediaUrl && hasText && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0) 22%, rgba(15,23,42,0.1) 40%, rgba(15,23,42,0.92) 78%)" }}
        />
      )}
      {!mediaUrl && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={DOTS_BG} />
          <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute -left-10 top-1/3 w-24 h-24 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.06)" }} />
        </>
      )}

      <div className="relative z-10 flex items-center justify-between gap-2 min-h-[26px] shrink-0">
        {ad.tag ? (
          <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm" style={{ background: theme.accent, color: "#1f2937" }}>
            {ad.tag}
          </span>
        ) : <span />}
        {deadline && (
          <span className="flex items-center gap-1 text-[11px] font-extrabold text-white px-2.5 py-1 rounded-full bg-black/30">
            <Clock size={11} /> {deadline}
          </span>
        )}
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center" style={{ containerType: "size" }}>
        {!mediaUrl && ad.emoji && (
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              height: "min(80cqh, 116px)",
              aspectRatio: "1 / 1",
              background: "rgba(255,255,255,0.16)",
              boxShadow: "0 0 0 min(8cqh, 10px) rgba(255,255,255,0.07), 0 12px 30px rgba(0,0,0,0.18)",
              fontSize: "min(42cqh, 60px)",
              lineHeight: 1,
            }}
          >
            {ad.emoji}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-2.5 shrink-0">
        {discount && (
          <p className="font-black leading-none tracking-tight" style={{ color: theme.accent, fontSize: "clamp(34px, 13cqw, 52px)", textShadow: "0 3px 14px rgba(0,0,0,0.25)" }}>
            {discount}
          </p>
        )}
        {(ad.headline || ad.subtext) && (
          <div>
            {ad.headline && (
              <h3 className="text-white font-extrabold text-xl leading-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>{ad.headline}</h3>
            )}
            {ad.subtext && <p className="text-white/90 text-sm font-semibold mt-1 leading-snug">{ad.subtext}</p>}
          </div>
        )}
        {highlights.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-center gap-2 text-[13px] font-bold text-white leading-tight">
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent, color: "#1f2937" }}>
                  <Check size={11} strokeWidth={3.5} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        )}
        {coupon && (
          <div className="flex items-center justify-between gap-2 text-white px-3 py-2 rounded-xl border-2 border-dashed border-white/60 bg-white/10">
            <span className="text-xs font-semibold text-white/85">Use code</span>
            <span className="flex items-center gap-1.5 text-sm font-black tracking-wider">{coupon} <Copy size={13} /></span>
          </div>
        )}
        {ad.cta?.label && (
          <div className="w-full flex items-center justify-center gap-1.5 bg-white text-sm font-extrabold px-4 py-2.5 rounded-xl" style={{ color: theme.ink, boxShadow: "0 6px 18px rgba(0,0,0,0.22)" }}>
            {ad.cta.label} <ArrowRight size={15} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdPreview;
