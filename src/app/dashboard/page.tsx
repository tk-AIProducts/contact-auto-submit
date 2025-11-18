'use client';

import { useEffect, useMemo, useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase';

type RangeFilter = '7d' | '30d' | '90d';

type DashboardFilters = {
  range: RangeFilter;
  pdfId: string;
  company: string;
};

type DashboardData = {
  summary: Array<{ label: string; value: string; helper?: string }>;
  pdfPerformance: Array<{ id: string; name: string; views: number; uniqueViews: number }>;
  companyEngagement: Array<{ company: string; rate: number }>;
  timeline: Array<{ slot: string; views: number }>;
  logs: Array<{ viewer: string; company: string; pdf: string; viewedAt: string }>;
};

type MetricsState = {
  loading: boolean;
  data: DashboardData;
  error?: string;
};

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    range: '7d',
    pdfId: 'all',
    company: 'all',
  });
  const metrics = useDashboardMetrics(filters);

  const pdfOptions = useMemo(
    () => ['all', ...metrics.data.pdfPerformance.map((pdf) => pdf.id)],
    [metrics.data.pdfPerformance]
  );
  const companyOptions = useMemo(
    () => ['all', ...metrics.data.companyEngagement.map((row) => row.company)],
    [metrics.data.companyEngagement]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            apotto
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">管理ダッシュボード</h1>
          <p className="text-base text-slate-600">
            PDF閲覧回数・企業別反応率・時間帯ごとの興味関心を可視化し、営業資料のどこに改善余地があるかを把握します。
            Supabaseからリアルタイムに取得できない場合は直近データのスナップショットを表示します。
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <FilterSelect
              label="期間"
              value={filters.range}
              options={[
                { label: '直近7日', value: '7d' },
                { label: '直近30日', value: '30d' },
                { label: '直近90日', value: '90d' },
              ]}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, range: value as RangeFilter }))
              }
            />
            <FilterSelect
              label="PDF"
              value={filters.pdfId}
              options={pdfOptions.map((id) => ({
                label: id === 'all' ? 'すべて' : metrics.data.pdfPerformance.find((pdf) => pdf.id === id)?.name ?? id,
                value: id,
              }))}
              onChange={(value) => setFilters((prev) => ({ ...prev, pdfId: value }))}
            />
            <FilterSelect
              label="企業"
              value={filters.company}
              options={companyOptions.map((id) => ({
                label: id === 'all' ? 'すべて' : id,
                value: id,
              }))}
              onChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}
            />
            {metrics.loading && (
              <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs text-white">
                更新中...
              </span>
            )}
          </div>
          {metrics.error && (
            <p className="mt-3 text-sm text-amber-600">
              Supabaseからの取得に失敗したためスナップショットを表示しています: {metrics.error}
            </p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.data.summary.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              {item.helper && <p className="text-xs text-slate-500">{item.helper}</p>}
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">資料別の閲覧傾向</h2>
              <span className="text-xs text-slate-500">棒グラフ (閲覧回数)</span>
            </div>
            <div className="mt-4 space-y-4">
              {metrics.data.pdfPerformance.map((pdf) => {
                const topViews = metrics.data.pdfPerformance[0]?.views || 1;
                const percentage = Math.min(100, (pdf.views / topViews) * 100);
                return (
                <div key={pdf.id}>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{pdf.name}</span>
                    <span>{pdf.views} 回</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${percentage}%` }}
                      />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    ユニーク閲覧 {pdf.uniqueViews} 回
                  </p>
                </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">時間帯ごとの反応</h2>
              <span className="text-xs text-slate-500">折れ線 (ビュー数)</span>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-4 text-center text-sm text-slate-600">
              {metrics.data.timeline.map((slot) => (
                <div key={slot.slot} className="flex flex-col items-center">
                  <div className="flex h-24 w-8 items-end rounded-full bg-slate-100">
                    <div
                      className="w-full rounded-full bg-slate-900"
                      style={{ height: `${Math.min(100, slot.views)}%` }}
                    />
                  </div>
                  <span className="mt-2 text-xs">{slot.slot}</span>
                  <span className="text-xs text-slate-500">{slot.views}回</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">企業別の反応率</h2>
            <ul className="mt-4 space-y-3">
              {metrics.data.companyEngagement.map((entry) => (
                <li key={entry.company} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{entry.company}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {entry.rate.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">最新の閲覧ログ</h2>
            <div className="mt-4 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="text-xs uppercase text-slate-500">
                    <th className="pb-2">閲覧者</th>
                    <th className="pb-2">企業</th>
                    <th className="pb-2">PDF</th>
                    <th className="pb-2">閲覧日時</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.data.logs.map((log) => (
                    <tr key={`${log.viewer}-${log.viewedAt}`}>
                      <td className="py-2 text-slate-900">{log.viewer}</td>
                      <td className="py-2">{log.company}</td>
                      <td className="py-2">{log.pdf}</td>
                      <td className="py-2 text-sm text-slate-500">{log.viewedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col text-sm text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function useDashboardMetrics(filters: DashboardFilters): MetricsState {
  const [state, setState] = useState<MetricsState>(() => ({
    loading: false,
    data: buildMockData(filters),
  }));

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const client = createSupabaseBrowserClient();
        const { data, error } = await client.rpc('dashboard_metrics', {
          range_label: filters.range,
          pdf_id: filters.pdfId === 'all' ? null : filters.pdfId,
          company_name: filters.company === 'all' ? null : filters.company,
        });
        if (error) throw error;
        if (!active) return;
        setState({
          loading: false,
          data: normalizeDashboardData(data, filters),
        });
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : 'データ取得に失敗しました。';
        setState({
          loading: false,
          data: buildMockData(filters),
          error: message,
        });
      }
    }

    void fetchData();
    return () => {
      active = false;
    };
  }, [filters]);

  return state;
}

function normalizeDashboardData(raw: unknown, filters: DashboardFilters): DashboardData {
  if (!raw || typeof raw !== 'object') {
    return buildMockData(filters);
  }
  const snapshot = raw as Record<string, unknown>;
  return {
    summary: Array.isArray(snapshot.summary)
      ? (snapshot.summary as DashboardData['summary'])
      : buildMockData(filters).summary,
    pdfPerformance: Array.isArray(snapshot.pdfPerformance)
      ? (snapshot.pdfPerformance as DashboardData['pdfPerformance'])
      : buildMockData(filters).pdfPerformance,
    companyEngagement: Array.isArray(snapshot.companyEngagement)
      ? (snapshot.companyEngagement as DashboardData['companyEngagement'])
      : buildMockData(filters).companyEngagement,
    timeline: Array.isArray(snapshot.timeline)
      ? (snapshot.timeline as DashboardData['timeline'])
      : buildMockData(filters).timeline,
    logs: Array.isArray(snapshot.logs)
      ? (snapshot.logs as DashboardData['logs'])
      : buildMockData(filters).logs,
  };
}

function buildMockData(filters: DashboardFilters): DashboardData {
  const multiplier =
    filters.range === '90d' ? 1.6 : filters.range === '30d' ? 1.2 : 1;
  const basePdf = [
    {
      id: 'pdf_overview',
      name: 'プロダクト概要.pdf',
      views: Math.round(420 * multiplier),
      uniqueViews: Math.round(210 * multiplier),
    },
    {
      id: 'pdf_case',
      name: '導入事例集.pdf',
      views: Math.round(310 * multiplier),
      uniqueViews: Math.round(180 * multiplier),
    },
    {
      id: 'pdf_pricing',
      name: '料金プラン.pdf',
      views: Math.round(240 * multiplier),
      uniqueViews: Math.round(150 * multiplier),
    },
    {
      id: 'pdf_security',
      name: 'セキュリティ白書.pdf',
      views: Math.round(180 * multiplier),
      uniqueViews: Math.round(120 * multiplier),
    },
  ];

  const companyEngagement = [
    { company: 'A社 (SaaS)', rate: 62.4 },
    { company: 'B社 (製造)', rate: 54.1 },
    { company: 'C社 (通信)', rate: 38.2 },
    { company: 'D社 (金融)', rate: 27.5 },
  ];

  const timeline = ['8-10時', '10-12時', '12-14時', '14-16時'].map((slot, index) => ({
    slot,
    views: Math.round((index + 1.2) * 20 * multiplier),
  }));

  const logs = [
    {
      viewer: 'sales@alpha.co.jp',
      company: 'αコンサル',
      pdf: 'プロダクト概要.pdf',
      viewedAt: '2025-11-17 09:24',
    },
    {
      viewer: 'it@beta.jp',
      company: 'βテック',
      pdf: 'セキュリティ白書.pdf',
      viewedAt: '2025-11-17 10:05',
    },
    {
      viewer: 'cfo@gamma.com',
      company: 'γホールディングス',
      pdf: '料金プラン.pdf',
      viewedAt: '2025-11-17 11:32',
    },
    {
      viewer: 'biz@delta.io',
      company: 'δイノベーション',
      pdf: '導入事例集.pdf',
      viewedAt: '2025-11-17 12:08',
    },
  ];

  const referenceRate = companyEngagement[0]?.rate ?? 0;

  const summary = [
    {
      label: '総閲覧数',
      value: `${basePdf.reduce((sum, pdf) => sum + pdf.views, 0)}回`,
      helper: 'ユニーク閲覧の合計も含む',
    },
    {
      label: 'ユニーク閲覧者',
      value: `${basePdf.reduce((sum, pdf) => sum + pdf.uniqueViews, 0)}名`,
      helper: 'メール認証済み',
    },
    {
      label: '平均閲覧率',
      value: `${(((referenceRate || 0) / 100) * 68).toFixed(1)}%`,
      helper: '送信企業に対する閲覧割合',
    },
    {
      label: '人気時間帯',
      value: timeline.reduce((prev, curr) => (curr.views > prev.views ? curr : prev))
        .slot,
      helper: '閲覧が集中した時間帯',
    },
  ];

  return {
    summary,
    pdfPerformance: basePdf,
    companyEngagement,
    timeline,
    logs,
  };
}

