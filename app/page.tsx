"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// animation presets
const glowBlue = { boxShadow: "0 0 20px #2563eb", scale: 1.06 };
const glowGreen = { boxShadow: "0 0 20px #16a34a", scale: 1.06 };
const glowYellow = { boxShadow: "0 0 20px #fbbf24", scale: 1.06 };
const shakeRed = {
  x: [0, -6, 6, -6, 6, 0],
  transition: { duration: 0.5 },
};

export default function Home() {
  const [text, setText] = useState("AABAACAADAABAABA");
  const [pattern, setPattern] = useState("AABA");

  // pointers
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);

  // lps
  const [lps, setLps] = useState<number[]>([]);
  const [lpIndex, setLpIndex] = useState(1);
  const [lpLen, setLpLen] = useState(0);

  // tutorial
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [found, setFound] = useState<number[]>([]);

  // RESET when pattern changes
  useEffect(() => {
    const size = pattern.length;
    setLps(new Array<number>(size).fill(0));
    setLpIndex(1);
    setLpLen(0);
    setI(0);
    setJ(0);
    setStep(1);
  }, [pattern]);

  // SAFE MATCH RECOMPUTATION
  useEffect(() => {
    const computeMatches = () => {
      const M = pattern.length;
      const N = text.length;
      if (M === 0 || N === 0 || M > N) return [];

      // temp LPS
      const temp = new Array<number>(M).fill(0);
      for (let k = 1; k < M; k++) {
        let b = temp[k - 1];
        while (b > 0 && pattern[k] !== pattern[b]) b = temp[b - 1];
        if (pattern[k] === pattern[b]) b++;
        temp[k] = b;
      }

      const res = [];
      let ti = 0, pj = 0;
      while (ti < N) {
        if (text[ti] === pattern[pj]) {
          ti++; pj++;
          if (pj === M) {
            res.push(ti - pj);
            pj = temp[pj - 1];
          }
        } else {
          if (pj !== 0) pj = temp[pj - 1];
          else ti++;
        }
      }
      return res;
    };

    setFound(computeMatches());
  }, [text, pattern]);

  // --- LPS STEP ---
  const stepLPS = () => {
    const M = pattern.length;
    if (lpIndex >= M) {
      setStep(3);
      return;
    }

    const updated = [...lps];

    if (pattern[lpIndex] === pattern[lpLen]) {
      updated[lpIndex] = lpLen + 1;
      setLps(updated);
      setLpLen(lpLen + 1);
      setLpIndex(lpIndex + 1);
    } else {
      if (lpLen !== 0) {
        setLpLen(updated[lpLen - 1]);
      } else {
        updated[lpIndex] = 0;
        setLps(updated);
        setLpIndex(lpIndex + 1);
      }
    }
  };

  // --- MATCH STEP ---
  const doMatch = () => {
    if (i >= text.length) {
      setStep(6);
      setPlaying(false);
      return;
    }

    if (text[i] === pattern[j]) {
      setI(i + 1);
      setJ(j + 1);

      // full match
      if (j + 1 === pattern.length) {
        setTimeout(() => {
          setJ(lps[j] ?? 0);
        }, 200);
      }
    } else {
      if (j !== 0) setJ(lps[j - 1] ?? 0);
      else setI(i + 1);
    }
  };

  // --- AUTO TUTOR FLOW ---
  const autoStep = () => {
    if (step === 1) return setStep(2);
    if (step === 2) return stepLPS();
    if (step === 3) {
      setI(0);
      setJ(0);
      return setStep(4);
    }
    if (step === 4) return setStep(5);
    if (step === 5) return doMatch();
    if (step === 6) return setPlaying(false);
  };

  // --- LOOPING ---
  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(autoStep, speed);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [playing, step, i, j, lpIndex, lpLen, speed]);

  // --- RESET ---
  const restart = () => {
    setPlaying(false);
    setStep(1);
    setLps(new Array<number>(pattern.length).fill(0));
    setLpIndex(1);
    setLpLen(0);
    setI(0);
    setJ(0);
  };

  const stepText = [
    "Preprocess pattern → build LPS",
    "Building LPS…",
    "Initialize i and j pointers",
    "Compare characters",
    "Mismatch → use LPS to jump",
    "Done — matches highlighted",
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT MAIN */}
        <div className="md:col-span-2">
          <h1 className="text-center text-3xl font-bold mb-6">
            KMP Visualizer — Clean Animation Mode
          </h1>

          {/* CONTROLS */}
          <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={restart} className="px-3 py-2 bg-red-600 rounded">
                Restart
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="px-3 py-2 bg-indigo-600 rounded"
              >
                {playing ? "⏸ Pause" : "▶ Start"}
              </button>
              <button onClick={autoStep} className="px-3 py-2 bg-gray-700 rounded">
                Step ▶
              </button>

              <div className="ml-auto flex items-center gap-2 text-sm">
                Speed
                <input
                  type="range"
                  min="120"
                  max="1500"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
                {speed}ms
              </div>
            </div>

            <h2 className="mt-4 text-xl">
              <span className="text-emerald-400">Step {step}: </span>
              {stepText[step - 1]}
            </h2>

            <div className="mt-2 text-sm text-gray-400">
              Matches:{" "}
              <b className="text-emerald-300">{found.length}</b>{" "}
              {found.length > 0 && (
                <span className="ml-4">Indices: {found.join(", ")}</span>
              )}
            </div>
          </div>

          {/* VISUALIZER */}
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-xl">

            {/* TEXT */}
            <div className="flex gap-1 mb-10">
              {text.split("").map((c, idx) => (
                <motion.div
                  key={idx}
                  animate={
                    idx === i
                      ? glowBlue
                      : found.includes(idx)
                      ? glowGreen
                      : {}
                  }
                  transition={{ type: "spring", stiffness: 240 }}
                  className="flex items-center justify-center w-12 h-12 rounded border text-lg font-medium border-gray-700 bg-gray-800"
                >
                  {c}
                </motion.div>
              ))}
            </div>

            {/* PATTERN */}
            <div className="flex gap-1 mb-10">
              {pattern.split("").map((c, idx) => (
                <motion.div
                  key={idx}
                  animate={
                    idx === j && step >= 4
                      ? glowGreen
                      : step === 5 && idx === j
                      ? shakeRed
                      : {}
                  }
                  className="flex items-center justify-center w-12 h-12 rounded border text-lg font-medium border-gray-700 bg-gray-800"
                >
                  {c}
                </motion.div>
              ))}
            </div>

            {/* LPS TABLE */}
            {step >= 2 && (
              <>
                <h3 className="text-sm text-gray-400 mb-2">LPS Table</h3>
                <div className="flex gap-2 flex-wrap">
                  {lps.map((val, idx) => (
                    <motion.div
                      key={idx}
                      animate={idx === lpIndex ? glowYellow : {}}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-center"
                    >
                      <div className="text-xs text-gray-400">{idx}</div>
                      <div className="text-lg">{val}</div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Blue = text[i], Green = pattern[j], Yellow = building LPS
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl h-full sticky top-4">
          <h2 className="text-xl font-bold text-emerald-400 mb-4">Tutorial Steps</h2>

          <div className="mb-4">
            <label className="text-sm text-gray-300">Pattern</label>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded"
            />

            <label className="text-sm text-gray-300 mt-3 block">Text</label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded"
            />
          </div>

          <div className="space-y-2 text-sm">
            {stepText.map((t, idx) => (
              <div
                key={idx}
                className={`p-3 rounded bg-gray-800 ${
                  step === idx + 1 ? "ring-2 ring-emerald-500" : ""
                }`}
              >
                {idx + 1}. {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
