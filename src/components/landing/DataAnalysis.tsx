'use client';

import { useEffect, useRef, useState } from 'react';

function AnalysisCard({
  number,
  title,
  description,
  example,
  delay = 0,
}: {
  number: string;
  title: string;
  description: string;
  example?: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all ${isVisible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
          {number}
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
      {example && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          {example}
        </div>
      )}
    </div>
  );
}

export function DataAnalysis() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="data-analysis" className="py-24 bg-white relative overflow-hidden" ref={ref}>
      {/* 背景デコレーション */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10">
        {/* ヘッダー */}
        <div className={`text-center max-w-3xl mx-auto mb-16 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <span className="inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-600 tracking-wide uppercase mb-4">
            Data Analysis
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            データドリブン営業を実現する<br />
            <span className="text-emerald-600">インテント分析エンジン</span>
          </h2>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            apottoは、開封率・クリック率・反応パターンをAIが自動で解析し、<br className="hidden sm:block" />
            <span className="font-semibold text-slate-900">「いつ・誰に・どんなリストから送るべきか」</span>を最適化するデータ分析エンジンです。
          </p>
        </div>

        {/* 分析カード */}
        <div className="grid gap-6 lg:gap-8 md:grid-cols-3 mb-16">
          <AnalysisCard
            number="✔︎"
            title="最適な送信タイミングを自動算出"
            description="曜日 × 時間帯ごとの反応率を学習し、もっとも反応が返ってくる「黄金時間帯」をレコメンド。"
            delay={0}
            example={
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">火曜 10〜11時</span>
                  <span className="font-semibold text-emerald-600">開封率 22〜24%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">木曜 15〜16時</span>
                  <span className="font-semibold text-emerald-600">開封率 20〜21%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            }
          />
          <AnalysisCard
            number="✔︎"
            title="リスト別パフォーマンス分析"
            description="リストごとに「開封率・クリック率・インテント指数」を比較し、伸ばすべきリスト／改善すべきリストが一目で分かる。"
            delay={150}
            example={
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-600">リストA：<span className="font-semibold text-slate-900">高開封率で安定</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600">リストC：<span className="font-semibold text-slate-900">質の高いリード</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-slate-600">リストE：<span className="font-semibold text-slate-900">改善余地大</span></span>
                </div>
              </div>
            }
          />
          <AnalysisCard
            number="✔︎"
            title="AIが「次の一手」まで提案"
            description="分析で終わらず、AIが改善仮説を生成。営業担当が迷わず行動できる状態を作ります。"
            delay={300}
            example={
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>どの時間帯を優先すべきか</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>どのリストの訴求を横展開すべきか</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>架電と併用すべき送信タイミング</span>
                </div>
              </div>
            }
          />
        </div>

      </div>
    </section>
  );
}

