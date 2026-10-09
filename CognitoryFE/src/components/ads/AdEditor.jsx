import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Upload, Trash2, X } from "lucide-react";
import { createAd, updateAd, uploadAdMedia, removeAdMedia, publishAd } from "../../services/adAPIs";
import { successToast, errorToast } from "../toast/Toast";
import { inputCls, selectCls, labelCls, hintCls } from "../blog/blogUtils";
import AdPreview from "./AdPreview";
import { AD_TYPES, AD_THEMES, EMOJI_PICKS, MEDIA_RULES, RECOMMENDED_SIZE, emptyAd, toLocalInput, toIso } from "./adUtils";

const toForm = (ad) =>
  ad
    ? {
        name: ad.name || "",
        type: ad.type,
        tag: ad.tag || "",
        headline: ad.headline || "",
        subtext: ad.subtext || "",
        emoji: ad.emoji || "",
        highlights: [0, 1, 2].map((i) => ad.highlights?.[i] || ""),
        offer: {
          discountText: ad.offer?.discountText || "",
          couponCode: ad.offer?.couponCode || "",
          validTill: toLocalInput(ad.offer?.validTill),
        },
        cta: { label: ad.cta?.label || "", url: ad.cta?.url || "" },
        theme: ad.theme || "violet",
        order: ad.order ?? 0,
        startAt: toLocalInput(ad.startAt),
        endAt: toLocalInput(ad.endAt),
      }
    : emptyAd();

const Field = ({ label, hint, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
    {hint && <p className={hintCls}>{hint}</p>}
  </div>
);

const AdEditor = ({ ad, onClose, onSaved }) => {
  const [form, setForm] = useState(() => toForm(ad));
  const [adId, setAdId] = useState(ad?._id || null); // set once a new draft has been created
  const [media, setMedia] = useState(ad?.media?.url ? ad.media : null); // media saved on the server
  const [file, setFile] = useState(null); // new file waiting to be uploaded
  const [saving, setSaving] = useState("");
  const fileRef = useRef(null);

  const mediaKind = form.type === "video" ? "video" : "image";
  const rules = MEDIA_RULES[mediaKind];
  const mediaRequired = form.type === "image" || form.type === "video";
  const savedMediaFits = media && media.kind === mediaKind;

  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const previewUrl = fileUrl || (savedMediaFits ? media.url : "");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const changeType = (type) => {
    set("type", type);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickFile = (picked) => {
    if (!picked) return;
    const ext = picked.name.split(".").pop().toLowerCase();
    if (!rules.accept.split(",").includes(`.${ext}`)) return errorToast(`Allowed: ${rules.label}`);
    if (picked.size > rules.maxMb * 1024 * 1024) return errorToast(`File must be under ${rules.maxMb}MB`);
    setFile(picked);
  };

  const handleRemoveMedia = async () => {
    if (file) {
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (!adId || !media) return;
    if (!confirm("Remove the uploaded media from this ad?")) return;
    try {
      await removeAdMedia(adId);
      setMedia(null);
      onSaved?.(false);
    } catch {
      // error toast shown by service
    }
  };

  const save = async (alsoPublish) => {
    if (!form.name.trim()) return errorToast("Give the ad an internal name");
    setSaving(alsoPublish ? "publish" : "save");
    try {
      const payload = {
        ...form,
        order: Number(form.order) || 0,
        highlights: form.highlights.map((h) => h.trim()).filter(Boolean),
        offer: { ...form.offer, validTill: toIso(form.offer.validTill) },
        startAt: toIso(form.startAt),
        endAt: toIso(form.endAt),
      };
      let id = adId;
      if (id) {
        await updateAd(id, payload);
      } else {
        const created = await createAd(payload);
        id = created._id;
        setAdId(id);
      }
      if (file) {
        const withMedia = await uploadAdMedia(id, file);
        setMedia(withMedia.media);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      if (alsoPublish) await publishAd(id);
      successToast(alsoPublish ? "Ad published" : "Ad saved");
      onSaved?.(true);
    } catch {
      // error toast shown by service; keep the editor open, but refresh the list behind it
      onSaved?.(false);
    }
    setSaving("");
  };

  const isPublished = ad?.status === "published";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="bg-black border border-white/20 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-black z-10">
          <h2 className="text-white text-xl font-bold">{adId ? "Edit Ad" : "New Ad"}</h2>
          <button onClick={onClose} className="cursor-pointer text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
          {/* ── Form ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <Field label="Internal name *" hint="Only visible here in Cognitory.">
              <input className={inputCls} value={form.name} maxLength={120} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Diwali 20% off — Oct 2026" />
            </Field>

            <Field label="Ad type *" hint={AD_TYPES.find((t) => t.id === form.type)?.hint}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AD_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => changeType(t.id)}
                    className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-semibold transition border ${
                      form.type === t.id ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={`${mediaKind === "video" ? "Video" : mediaRequired ? "Image" : "Background image (optional)"}${mediaRequired ? " *" : ""}`}
              hint={`${rules.label}. Recommended ${RECOMMENDED_SIZE}`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition"
                >
                  <Upload className="w-4 h-4" />
                  {previewUrl ? "Replace" : "Choose file"}
                </button>
                {(file || savedMediaFits) && (
                  <>
                    <span className="text-white/60 text-xs truncate max-w-[220px]">{file ? `${file.name} (not saved yet)` : media.originalName}</span>
                    <button type="button" onClick={handleRemoveMedia} className="cursor-pointer text-red-400 hover:text-red-300" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {media && !savedMediaFits && !file && (
                  <span className="text-amber-400/80 text-xs">The saved {media.kind} doesn&apos;t fit this ad type — choose a new file.</span>
                )}
                <input ref={fileRef} type="file" accept={rules.accept} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Tag" hint="Small pill, e.g. New">
                <input className={inputCls} value={form.tag} maxLength={24} onChange={(e) => set("tag", e.target.value)} placeholder="Limited" />
              </Field>
              <div className="sm:col-span-2">
                <Field label={`Headline${form.type === "announcement" ? " *" : ""}`} hint={`${form.headline.length}/80`}>
                  <input className={inputCls} value={form.headline} maxLength={80} onChange={(e) => set("headline", e.target.value)} placeholder="Live Group Classes" />
                </Field>
              </div>
            </div>

            <Field label="Sub-text" hint={`${form.subtext.length}/160 — one or two short lines read best`}>
              <textarea className={inputCls} rows={2} value={form.subtext} maxLength={160} onChange={(e) => set("subtext", e.target.value)} />
            </Field>

            <Field label="Selling points" hint="Up to 3 short lines shown with a tick. They fill the ad and make it far more convincing.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {form.highlights.map((h, i) => (
                  <input
                    key={i}
                    className={inputCls}
                    value={h}
                    maxLength={40}
                    placeholder={["100 guided sessions", "Earn badges", "Pick your own time"][i]}
                    onChange={(e) => set("highlights", form.highlights.map((v, j) => (j === i ? e.target.value : v)))}
                  />
                ))}
              </div>
            </Field>

            {form.type === "offer" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Discount text" hint="e.g. 20% OFF">
                  <input className={inputCls} value={form.offer.discountText} maxLength={24} onChange={(e) => setNested("offer", "discountText", e.target.value)} />
                </Field>
                <Field label="Coupon code" hint="Students can tap to copy">
                  <input className={inputCls} value={form.offer.couponCode} maxLength={30} onChange={(e) => setNested("offer", "couponCode", e.target.value.toUpperCase())} />
                </Field>
                <Field label="Valid till" hint="Shown on the ad">
                  <input type="datetime-local" className={inputCls} value={form.offer.validTill} onChange={(e) => setNested("offer", "validTill", e.target.value)} />
                </Field>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Button label" hint="Leave empty for no button">
                <input className={inputCls} value={form.cta.label} maxLength={24} onChange={(e) => setNested("cta", "label", e.target.value)} placeholder="Explore Now" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Button link" hint="In-app page like /courses or /pricing, or a full https:// link">
                  <input className={inputCls} value={form.cta.url} onChange={(e) => setNested("cta", "url", e.target.value)} placeholder="/courses" />
                </Field>
              </div>
            </div>

            {!previewUrl && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Background colour" hint="Used when the ad has no image or video.">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(AD_THEMES).map(([id, theme]) => (
                      <button
                        key={id}
                        type="button"
                        title={id}
                        onClick={() => set("theme", id)}
                        className={`cursor-pointer w-10 h-10 rounded-xl border-2 transition ${form.theme === id ? "border-white scale-110" : "border-transparent"}`}
                        style={{ background: theme.bg }}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="Big emoji" hint="The picture of the ad when there is no media. Pick one or paste your own.">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {EMOJI_PICKS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => set("emoji", form.emoji === e ? "" : e)}
                        className={`cursor-pointer w-8 h-8 rounded-lg text-lg transition ${form.emoji === e ? "bg-white" : "bg-white/10 hover:bg-white/20"}`}
                      >
                        {e}
                      </button>
                    ))}
                    <input className={`${inputCls} !w-16 text-center`} value={form.emoji} maxLength={8} onChange={(e) => set("emoji", e.target.value)} placeholder="✨" />
                  </div>
                </Field>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Order" hint="Lower shows first">
                <input type="number" className={inputCls} value={form.order} onChange={(e) => set("order", e.target.value)} />
              </Field>
              <Field label="Start showing" hint="Empty = as soon as published">
                <input type="datetime-local" className={inputCls} value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
              </Field>
              <Field label="Stop showing" hint="Empty = until paused">
                <input type="datetime-local" className={inputCls} value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* ── Live preview ── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20 flex flex-col gap-2">
              <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Dashboard preview</p>
              <AdPreview ad={form} mediaUrl={previewUrl} mediaKind={mediaKind} className="w-full max-w-[340px] aspect-[4/5]" />
              <p className={hintCls}>
                The ad space on the student dashboard is a tall card about this shape. Its height changes a little between screens, so media is cropped from the edges to fill it.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 sticky bottom-0 bg-black">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white">Cancel</button>
          <button
            onClick={() => save(false)}
            disabled={!!saving}
            className="cursor-pointer flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition disabled:opacity-40"
          >
            {saving === "save" && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPublished ? "Save changes" : "Save draft"}
          </button>
          {!isPublished && (
            <button
              onClick={() => save(true)}
              disabled={!!saving}
              className="cursor-pointer flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition disabled:opacity-40"
            >
              {saving === "publish" && <Loader2 className="w-4 h-4 animate-spin" />}
              Save &amp; Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdEditor;
