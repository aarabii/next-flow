import { checkAndSyncUser } from "@/lib/auth";
import { User, Settings, Shield, Sliders, Bell, Sparkles, Cpu } from "lucide-react";
import Image from "next/image";

export default async function SettingsPage() {
  const user = await checkAndSyncUser();

  return (
    <div className="w-full pb-12 pl-15 pr-15 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200/60 pb-6 mb-8">
        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
          <Settings className="w-6 h-6 animate-spin-[spin_3s_linear_infinite]" />
        </div>
        <div>
          <h1 className="font-body text-heading-lg-google font-semibold text-text-primary">
            Settings
          </h1>
          <p className="text-small text-text-secondary">
            Manage your account preferences and application defaults
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Profile card */}
        <div className="md:col-span-1 space-y-6">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 flex flex-col items-center text-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

            <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-purple-500/20 shadow-md">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.name || "User profile"}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            <h2 className="font-semibold text-text-primary text-lg">
              {user.name || "NextFlow Developer"}
            </h2>
            <p className="text-xs text-text-secondary mb-4">{user.email}</p>

            <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 space-y-2.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Account ID</span>
                <span className="font-mono text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200/40 text-[10px]">
                  {user.id.substring(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Free Tier
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* General Preferences */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Sliders className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-text-primary">General Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className="text-sm font-medium text-text-primary block">
                    Default Model Settings
                  </label>
                  <span className="text-xs text-text-secondary">
                    Select the default Google Gemini model for workflows
                  </span>
                </div>
                <select className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2 cursor-pointer font-medium">
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Free / Recommended)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Free / Fastest)</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-zinc-50">
                <div>
                  <label className="text-sm font-medium text-text-primary block">
                    Developer Mode
                  </label>
                  <span className="text-xs text-text-secondary">
                    Show advanced node debug inputs and run outputs in canvas
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-zinc-50">
                <div>
                  <label className="text-sm font-medium text-text-primary block">
                    Auto-Save Interval
                  </label>
                  <span className="text-xs text-text-secondary">
                    Auto-save changes to the database while building
                  </span>
                </div>
                <select className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2 cursor-pointer font-medium">
                  <option value="5">Every 5 seconds</option>
                  <option value="15">Every 15 seconds</option>
                  <option value="30">Every 30 seconds</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-text-primary">AI Models Capabilities</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl">
                <Cpu className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-purple-900">
                    Google Gemini 2.5 Free Tier Active
                  </h4>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    You are utilizing Google's free-tier Gemini API configuration. This includes
                    up to 15 Requests Per Minute (RPM) and 1500 Requests Per Day (RPD). To bypass rate limits, execution delays are automatically handled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
