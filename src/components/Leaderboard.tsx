import React, { useEffect, useState } from 'react';
import { getHighScores, saveHighScore, isSupabaseConfigured } from '../lib/supabase';
import { ScoreEntry } from '../types';
import { Database, Sparkles, Terminal, RefreshCw, Trophy, UserPlus, Info } from 'lucide-react';

interface LeaderboardProps {
  currentScore: number;
  currentDistance: number;
  characterClass: string;
  onRefreshTrigger?: number; // External dependency to trigger scoring re-fetches
}

export function Leaderboard({ currentScore, currentDistance, characterClass, onRefreshTrigger }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [isRealDb, setIsRealDb] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const hasDirectSupabase = isSupabaseConfigured();

  const loadScores = async () => {
    setLoading(true);
    try {
      const response = await getHighScores();
      setScores(response.data);
      setIsRealDb(response.realDatabase);
    } catch (e) {
      console.error('Error fetching high scores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, [onRefreshTrigger]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || submitting || submitted) return;

    setSubmitting(true);
    try {
      const durationSeconds = Math.floor(currentDistance / 15); // Simulated duration
      const payload: ScoreEntry = {
        username: username.trim().substring(0, 16),
        score: currentScore,
        distance: parseFloat(currentDistance.toFixed(1)),
        duration_seconds: durationSeconds,
        character_class: characterClass
      };

      const result = await saveHighScore(payload);
      if (result.success) {
        setSubmitted(true);
        setStatusMessage(result.realDatabase 
          ? '✔ Core Entry Consigned to live Supabase ledger database!' 
          : '✔ Saved locally. Connect your Supabase keys in .env for global scoreboard sync!'
        );
        loadScores();
      } else {
        setStatusMessage(`ERROR: ${result.error || 'Failed to submit high score'}`);
      }
    } catch (err: any) {
      setStatusMessage(`EXCEPTION: ${err.message || 'Submission error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel border-stone-850/60 rounded-xl p-5 flex flex-col relative overflow-hidden bg-black/45 select-text">
      
      {/* Sync ledger database banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#F27D26] uppercase flex items-center gap-2">
          <Trophy size={13} className="text-[#F27D26]" />
          Abyssum High Score Board
        </h2>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-black flex items-center gap-1 ${
            isRealDb 
              ? 'bg-green-950/40 border border-green-800 text-green-400' 
              : 'bg-zinc-950 border border-zinc-800 text-zinc-550'
          }`}>
            <span className={`w-1 h-1 rounded-full ${isRealDb ? 'bg-green-400 animate-pulse' : 'bg-zinc-400'}`} />
            {isRealDb ? 'SUPABASE ACTIVE' : 'LOCAL OFFLINE CACHE'}
          </span>
          <button 
            onClick={loadScores}
            className="text-zinc-500 hover:text-[#F27D26] cursor-pointer"
            title="Reload leaderboard ledger"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Submission Panel block (only show if player completed a run with positive points and haven't submitted yet) */}
      {currentScore > 0 && !submitted && (
        <form onSubmit={handleSubmitScore} className="mb-5 p-3.5 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-lg flex flex-col gap-2 relative">
          <div className="absolute top-1 right-2 text-[6px] font-mono text-[#F27D26]/60 uppercase tracking-widest">SUBMISSION PROTOCOL</div>
          <div className="text-[10px] text-[#ffd3b0] font-mono flex items-center gap-1">
            <Sparkles size={11} className="text-[#F27D26] animate-pulse" />
            <span>Consign Current Run: <strong className="text-white">{currentScore.toLocaleString()} pts</strong> ({Math.floor(currentDistance)}m)</span>
          </div>

          <div className="flex gap-2.5 mt-1">
            <input
              type="text"
              placeholder="ENTER COAXIAL USERNAME..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-[#F27D26]/50 flex-1 uppercase"
              required
              disabled={submitting}
              maxLength={16}
            />
            <button
              type="submit"
              disabled={submitting || !username.trim()}
              className="py-1.5 px-4 bg-[#F27D26]/10 hover:bg-[#F27D26]/20 border border-[#F27D26]/30 text-[10px] font-mono font-bold uppercase tracking-widest text-[#F27D26] rounded cursor-pointer disabled:opacity-40"
            >
              {submitting ? 'SENDING...' : 'REGISTER'}
            </button>
          </div>
        </form>
      )}

      {/* Success / Error Status Response */}
      {statusMessage && (
        <div className="mb-4 p-2 bg-zinc-950 border border-zinc-900 rounded text-[9px] font-mono text-zinc-400">
          {statusMessage}
        </div>
      )}

      {/* Scores Grid table entries */}
      <div className="flex-1 overflow-y-auto no-scrollbar max-h-[300px] flex flex-col gap-1.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#F27D26]/40 font-mono text-[10px]">
            <RefreshCw size={18} className="animate-spin text-[#F27D26]" />
            <span>RETRIEVING LEDGER CACHE...</span>
          </div>
        ) : scores.length === 0 ? (
          <div className="py-12 text-center text-[10px] font-mono text-zinc-550 uppercase">
            No entries catalogued. Launch dynamic run.
          </div>
        ) : (
          scores.map((score, index) => {
            const isTop3 = index < 3;
            const markerColors = [
              'text-yellow-450 font-black',  // 1st Gold
              'text-zinc-350 font-black',    // 2nd Silver
              'text-amber-600 font-bold'     // 3rd Bronze
            ];
            const marker = isTop3 ? `0${index + 1}` : `${index + 1}`;

            return (
              <div 
                key={score.id || index}
                className="flex items-center justify-between p-2.5 rounded bg-zinc-950/60 border border-zinc-900/60 hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-mono shrink-0 w-6 ${isTop3 ? markerColors[index] : 'text-zinc-600'}`}>
                    #{marker}
                  </span>
                  
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono text-zinc-100 font-medium block uppercase tracking-wide truncate">
                      {score.username}
                    </span>
                    <span className="text-[8px] text-zinc-550 block uppercase truncate">
                      {score.character_class} // {Math.floor(score.distance)}m
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#F27D26] glow-cyan">
                    {score.score.toLocaleString()}
                  </span>
                  <span className="text-[7.5px] text-zinc-650 block uppercase tracking-wider">
                    {score.created_at ? new Date(score.created_at).toLocaleDateString() : 'ARCHIVE_SEED'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-zinc-900/80 flex flex-col gap-1.5 text-[8.5px] font-mono text-[#F27D26]/80 rounded bg-stone-950/20 p-2 border border-stone-900">
        <div className="flex items-start gap-1.5">
          <Info size={12} className="shrink-0 text-[#F27D26]" />
          <p className="leading-relaxed leading-normal">
            To synchronize scores globally online, input your live database credentials in .env inside: <code className="bg-black px-1 border border-zinc-850 text-[#F27D26]">SUPABASE_URL</code> and <code className="bg-black px-1 border border-zinc-850 text-[#F27D26]">SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>

    </div>
  );
}
