import { useEffect, useState } from "react";
import { Megaphone, Plus, Globe, PauseCircle, Pencil, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { getAds, publishAd, pauseAd, deleteAd } from "../../services/adAPIs";
import { successToast } from "../toast/Toast";
import AdEditor from "./AdEditor";
import { AD_TYPES, AD_THEMES, formatDateTime, liveState } from "./adUtils";

const STATUS_FILTERS = ["all", "draft", "published", "paused"];

const STATE_STYLES = {
  live: "bg-green-500/30 text-green-300",
  scheduled: "bg-blue-500/30 text-blue-300",
  ended: "bg-red-500/30 text-red-300",
  draft: "bg-yellow-500/30 text-yellow-300",
  paused: "bg-white/15 text-white/60",
};

const typeLabel = (type) => AD_TYPES.find((t) => t.id === type)?.label || type;

const Thumb = ({ ad }) => (
  <div
    className="w-16 h-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-2xl"
    style={{ background: (AD_THEMES[ad.theme] || AD_THEMES.violet).bg }}
  >
    {ad.media?.url && ad.media.kind === "image" && <img src={ad.media.url} alt="" className="w-full h-full object-cover" />}
    {ad.media?.url && ad.media.kind === "video" && (
      <video src={ad.media.url} className="w-full h-full object-cover" muted preload="metadata" />
    )}
    {!ad.media?.url &&
      (ad.emoji ||
        (ad.type === "video" ? <Video className="w-5 h-5 text-white/60" /> : ad.type === "image" ? <ImageIcon className="w-5 h-5 text-white/60" /> : <Megaphone className="w-5 h-5 text-white/60" />))}
  </div>
);

const Ads = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null); // null = closed, {} = new, ad = edit

  const fetchAds = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const data = await getAds({ status: status === "all" ? undefined : status });
    setAds(data?.ads || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, [status]);

  const act = async (fn, message) => {
    try {
      await fn();
      successToast(message);
      fetchAds(false);
    } catch {
      // error toast shown by service
    }
  };

  const handlePublish = (ad) => {
    if (!confirm(`Publish "${ad.name}"? It will show on the GradeNext student dashboard.`)) return;
    act(() => publishAd(ad._id), "Ad published");
  };

  const handlePause = (ad) => {
    if (!confirm(`Pause "${ad.name}"? It will stop showing on the dashboard.`)) return;
    act(() => pauseAd(ad._id), "Ad paused");
  };

  const handleDelete = (ad) => {
    if (!confirm(`Delete "${ad.name}"? This cannot be undone.`)) return;
    act(() => deleteAd(ad._id), "Ad deleted");
  };

  return (
    <div className="p-4 md:p-6 text-white w-full">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6" />
          <h1 className="text-xl font-bold">Ads</h1>
        </div>
        <button
          onClick={() => setEditing({})}
          className="cursor-pointer flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition"
        >
          <Plus className="w-4 h-4" />
          New Ad
        </button>
      </div>
      <p className="text-white/40 text-sm mb-6">
        Published ads rotate in the ad space on the GradeNext student dashboard. Changes can take up to a minute to appear.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition ${
              status === f ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No ads here yet. Create your first ad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ads.map((ad) => {
            const state = liveState(ad);
            return (
              <div
                key={ad._id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/30 transition flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(ad)}>
                  <Thumb ad={ad} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATE_STYLES[state]}`}>{state}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">{typeLabel(ad.type)}</span>
                      <span className="text-xs text-white/40">Order {ad.order}</span>
                    </div>
                    <h3 className="font-semibold truncate">{ad.name}</h3>
                    <p className="text-white/40 text-xs mt-1 truncate">
                      {ad.headline || "No headline"}
                      {ad.startAt ? ` · From ${formatDateTime(ad.startAt)}` : ""}
                      {ad.endAt ? ` · Until ${formatDateTime(ad.endAt)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-center flex-wrap">
                  {ad.status === "published" ? (
                    <button onClick={() => handlePause(ad)} className="cursor-pointer flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition">
                      <PauseCircle className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : (
                    <button onClick={() => handlePublish(ad)} className="cursor-pointer flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition">
                      <Globe className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}
                  <button onClick={() => setEditing(ad)} className="cursor-pointer flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(ad)} className="cursor-pointer flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <AdEditor
          key={editing._id || "new"}
          ad={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(close) => {
            fetchAds(false);
            if (close) setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default Ads;
