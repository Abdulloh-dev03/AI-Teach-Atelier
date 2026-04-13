"use client";

import { useRef, useState } from "react";
import { useGetProfileQuery, useUploadProfilePicMutation } from "@/store/authApi";
import {
  Settings,
  Share2,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Camera,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── Constants ──────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// ─── ProfilePicUploader ──────────────────────────────────────────────────────
function ProfilePicUploader({
  currentUrl,
  userName,
}: {
  currentUrl: string | null | undefined;
  userName: string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [uploadProfilePic, { isLoading }] = useUploadProfilePicMutation();

  const displayUrl = preview ?? currentUrl;
  const initial = userName?.[0]?.toUpperCase() ?? "?";

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setClientError(null);
    setSuccessMsg(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setClientError("Only JPEG, PNG, WebP or GIF images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setClientError("Image must be smaller than 2 MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const cancelPreview = () => {
    setPreview(null);
    setSelectedFile(null);
    setClientError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setClientError(null);
    setSuccessMsg(null);

    const form = new FormData();
    form.append("profilePic", selectedFile);

    try {
      await uploadProfilePic(form).unwrap();
      setSuccessMsg("Profile picture updated!");
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      const msg =
        err?.data?.error ??
        err?.error ??
        "Upload failed. Please try again.";
      setClientError(msg);
    }
  };

  return (
    <div className="relative group">
      {/* Avatar / preview */}
      <div className="w-32 h-32 rounded-[40px] overflow-hidden shadow-(--shadow-ambient-elevated) transition-transform transform group-hover:scale-105 duration-500">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={`${userName ?? "User"}'s avatar`}
            width={128}
            height={128}
            className="w-full h-full object-cover"
            unoptimized={!!preview} // blob URLs don't go through Next image optimisation
          />
        ) : (
          <div className="w-full h-full bg-accent flex items-center justify-center text-4xl font-bold text-white italic">
            {initial}
          </div>
        )}

        {/* Overlay while loading */}
        {isLoading && (
          <div className="absolute inset-0 rounded-[40px] bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Camera trigger */}
      <button
        id="profile-pic-trigger"
        aria-label="Change profile picture"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-(--shadow-ambient) text-white cursor-pointer hover:bg-accent/80 active:scale-95 transition-all duration-200 disabled:opacity-60"
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* Badge */}
      <div className="absolute -top-2 -left-2 w-12 h-12 bg-surface-elevated rounded-2xl flex items-center justify-center shadow-(--shadow-ambient) text-amber-500">
        <Award className="w-6 h-6" />
      </div>

      {/* Hidden file input */}
      <input
        id="profile-pic-input"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview action bar */}
      {selectedFile && !isLoading && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 w-max">
          <button
            id="profile-pic-cancel"
            onClick={cancelPreview}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-elevated text-text-secondary text-xs font-semibold hover:bg-surface-card transition-all border border-border-subtle"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            id="profile-pic-upload"
            onClick={handleUpload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/80 transition-all shadow-sm"
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
        </div>
      )}

      {/* Feedback messages — shown below the avatar group */}
      {(clientError || successMsg) && !selectedFile && (
        <div
          className={cn(
            "absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold w-max max-w-55 text-center",
            clientError
              ? "bg-red-500/10 text-red-400 border border-red-400/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
          )}
        >
          {clientError ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          )}
          {clientError ?? successMsg}
        </div>
      )}
    </div>
  );
}

// ─── ProfileMetric ──────────────────────────────────────────────────────────
function ProfileMetric({
  label,
  value,
  subValue,
  icon,
}: {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface-card p-8 rounded-4xl shadow-(--shadow-ambient) hover:-translate-y-1 transition-all duration-500 ring-1 ring-border-subtle">
      <div className="flex items-center gap-2 text-text-secondary opacity-40 mb-4 uppercase tracking-[0.2em] font-bold text-[9px]">
        {icon} {label}
      </div>
      <div className="text-3xl font-bold text-text-primary mb-1 tracking-tighter">
        {value}
      </div>
      <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
        {subValue}
      </div>
    </div>
  );
}

// ─── BadgeItem ──────────────────────────────────────────────────────────────
function BadgeItem({ img, name }: { img: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-surface-elevated rounded-2xl hover:shadow-sm transition-all cursor-pointer group">
      <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
        <img
          src={img}
          alt={name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80"
        />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-center text-text-secondary opacity-60 group-hover:opacity-100">
        {name}
      </span>
    </div>
  );
}

// ─── ProfilePage ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: user } = useGetProfileQuery();

  return (
    <div className="w-full max-w-300 mx-auto py-10 px-6 bg-background-base text-text-primary">
      {/* Header / Identity */}
      <header className="mb-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        <div className="flex items-center gap-10">
          {/* Avatar with uploader — extra bottom space for action bar */}
          <div className="relative pb-8">
            <ProfilePicUploader
              currentUrl={user?.profilePic}
              userName={user?.name}
            />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[44px] font-bold tracking-tight text-text-primary leading-[1.1]">
                {user?.name ?? "Scholar"}
              </h1>
              <span className="text-[10px] font-bold text-white bg-accent px-3 py-1 rounded-full uppercase tracking-widest mt-4 self-start">
                Master Artisan
              </span>
            </div>
            <p className="text-text-secondary font-serif italic text-lg opacity-60">
              &quot;The code is the canvas; the logic is the brush.&quot;
            </p>
            <p className="text-text-secondary text-sm mt-1 opacity-40">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            className="rounded-2xl h-12 px-6 shadow-(--shadow-ambient) bg-surface-card hover:bg-surface-elevated text-text-primary border-none"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share Profile
          </Button>
          <Button
            variant="default"
            className="rounded-2xl h-12 px-6 shadow-(--shadow-ambient-elevated) bg-signature border-none"
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
        </div>
      </header>

      {/* Profile Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-20">
        <ProfileMetric
          label="ELO Rating"
          value="2,480"
          subValue="Top 2%"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <ProfileMetric
          label="Credits Earned"
          value="12.4k"
          subValue="Lifetime"
          icon={<Zap className="w-4 h-4" />}
        />
        <ProfileMetric
          label="Synthetics Solved"
          value="142"
          subValue="+12 this month"
          icon={<Sparkles className="w-4 h-4" />}
        />
        <ProfileMetric
          label="Atelier Time"
          value="248h"
          subValue="Active focus"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Main Content: Learning Pulse & Badges */}
      <div className="grid lg:grid-cols-3 gap-12">
        {/* Learning Pulse */}
        <div className="lg:col-span-2 bg-surface-card rounded-[40px] p-10 shadow-(--shadow-ambient)">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">
              Learning Pulse
            </h2>
            <div className="flex gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-text-secondary">
                Activity Map
              </span>
            </div>
          </div>
          <div className="h-64 w-full bg-surface-elevated/40 rounded-3xl flex items-end justify-between px-6 pb-6 gap-2 opacity-100 relative overflow-hidden">
            {[40, 70, 45, 90, 65, 80, 55, 100, 85, 75, 40, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-accent/20 rounded-t-lg group relative hover:bg-accent/40 transition-all cursor-pointer"
                style={{ height: `${h}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-accent text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {h} Synthetics
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges / Collections */}
        <div className="bg-surface-card rounded-[40px] p-10 shadow-(--shadow-ambient)">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-8">
            Collections
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <BadgeItem
              img="https://api.dicebear.com/7.x/identicon/svg?seed=1"
              name="Sorting Expert"
            />
            <BadgeItem
              img="https://api.dicebear.com/7.x/identicon/svg?seed=2"
              name="Logic Artisan"
            />
            <BadgeItem
              img="https://api.dicebear.com/7.x/identicon/svg?seed=3"
              name="Graph Voyager"
            />
            <BadgeItem
              img="https://api.dicebear.com/7.x/identicon/svg?seed=4"
              name="DP Architect"
            />
          </div>
          <Button
            variant="ghost"
            className="w-full mt-10 rounded-2xl h-12 text-accent font-bold gap-2 hover:bg-accent/10"
          >
            View All Badges <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
