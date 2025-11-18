'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react';
import { read, utils } from 'xlsx';

import { simulateAiWorkflow, type AiWorkflowRequest } from '@/lib/workflows';

type SenderProfile = {
  companyName: string;
  department: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
};

type CompanyCardField =
  | 'companyName'
  | 'contactName'
  | 'department'
  | 'title'
  | 'email'
  | 'homepageUrl'
  | 'notes';

type TrackingLink = {
  pdfId: string;
  token: string;
  url: string;
};

type CompanyCard = {
  id: string;
  companyName: string;
  contactName: string;
  department: string;
  title: string;
  email: string;
  homepageUrl: string;
  notes: string;
  generatedMessage: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  errorMessage?: string;
  sendEnabled: boolean;
  attachments: Record<string, TrackingLink>;
};

type PdfAsset = {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
};

type AiUploadState = {
  fileName?: string;
  importedCount: number;
  skippedCount: number;
  error?: string;
  lastImportedAt?: number;
};

type QueueState = {
  pendingIds: string[];
  running: boolean;
  lastProcessed?: string;
  error?: string;
};

const MAX_COMPANY_ROWS = 100;
const MAX_PDF_STORAGE_BYTES = 50 * 1024 * 1024;
const REQUIRED_SENDER_FIELDS: Array<keyof SenderProfile> = [
  'companyName',
  'fullName',
  'email',
  'subject',
];

export default function AiCustomPage() {
  const [senderProfile, setSenderProfile] = useState<SenderProfile>(
    createDefaultSenderProfile
  );
  const [cards, setCards] = useState<CompanyCard[]>([]);
  const [uploadState, setUploadState] = useState<AiUploadState>({
    importedCount: 0,
    skippedCount: 0,
  });
  const [pdfAssets, setPdfAssets] = useState<PdfAsset[]>([]);
  const [queueState, setQueueState] = useState<QueueState>({
    pendingIds: [],
    running: false,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const senderMissingFields = useMemo(
    () =>
      REQUIRED_SENDER_FIELDS.filter(
        (field) => senderProfile[field].trim().length === 0
      ),
    [senderProfile]
  );

  const sendableCards = useMemo(
    () => cards.filter((card) => card.sendEnabled),
    [cards]
  );
  const sendableReadyCards = useMemo(
    () => sendableCards.filter((card) => card.status === 'ready'),
    [sendableCards]
  );

  const enqueueGeneration = useCallback(
    (ids: string[], replace = false) => {
      setQueueState((prev) => ({
        ...prev,
        pendingIds: replace
          ? [...ids]
          : Array.from(new Set([...prev.pendingIds, ...ids])),
      }));
    },
    []
  );

  const clearQueue = useCallback(() => {
    setQueueState((prev) => ({ ...prev, pendingIds: [] }));
  }, []);

  const handleSenderProfileChange = useCallback(
    (field: keyof SenderProfile, value: string) => {
      setSenderProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleCardFieldChange = useCallback(
    (cardId: string, field: CompanyCardField, value: string) => {
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, [field]: value } : card
        )
      );
    },
    []
  );

  const handleMessageChange = useCallback((cardId: string, value: string) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const trimmed = value.trim();
        return {
          ...card,
          generatedMessage: value,
          status: trimmed.length ? 'ready' : 'pending',
        };
      })
    );
  }, []);

  const handleToggleSendEnabled = useCallback((cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, sendEnabled: !card.sendEnabled } : card
      )
    );
  }, []);

  const handleAttachmentToggle = useCallback(
    (cardId: string, pdfId: string, enabled: boolean) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card;
          if (enabled) {
            if (card.attachments[pdfId]) {
              return card;
            }
            return {
              ...card,
              attachments: {
                ...card.attachments,
                [pdfId]: buildTrackingLink(cardId, pdfId),
              },
            };
          }
          const nextAttachments = { ...card.attachments };
          delete nextAttachments[pdfId];
          return { ...card, attachments: nextAttachments };
        })
      );
    },
    []
  );

  const handlePdfUpload = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    let lastError: string | null = null;

    setPdfAssets((prev) => {
      let totalSize = prev.reduce((sum, asset) => sum + asset.size, 0);
      const next = [...prev];

      Array.from(files).forEach((file) => {
        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith('.pdf')) {
          lastError = 'PDFファイル（.pdf）のみアップロードできます。';
          return;
        }
        if (file.size === 0) {
          lastError = `${file.name} は空のファイルです。`;
          return;
        }
        if (totalSize + file.size > MAX_PDF_STORAGE_BYTES) {
          lastError = 'ご利用のPDFストレージ上限（50MB）を超えています。';
          return;
        }

        next.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          uploadedAt: Date.now(),
        });
        totalSize += file.size;
      });

      return next;
    });

    if (lastError) {
      setLogs((prev) => [...prev, `PDFアップロードエラー: ${lastError}`]);
    }
  }, []);

  const handlePdfRemove = useCallback((pdfId: string) => {
    setPdfAssets((prev) => prev.filter((asset) => asset.id !== pdfId));
    setCards((prev) =>
      prev.map((card) => {
        if (!card.attachments[pdfId]) return card;
        const nextAttachments = { ...card.attachments };
        delete nextAttachments[pdfId];
        return { ...card, attachments: nextAttachments };
      })
    );
  }, []);

  const handleManualCardAdd = useCallback(() => {
    setCards((prev) => [...prev, createEmptyCard()]);
  }, []);

  const handleClearCards = useCallback(() => {
    setCards([]);
    setUploadState({
      importedCount: 0,
      skippedCount: 0,
    });
    clearQueue();
    setLogs((prev) => [...prev, 'カードをリセットしました。']);
  }, [clearQueue]);

  const handleExcelUpload = useCallback(
    async (file: File) => {
      setUploadState((prev) => ({
        ...prev,
        fileName: file.name,
        error: undefined,
      }));

      try {
        const rows = await readSheetRows(file);
        if (rows.length <= 1) {
          throw new Error('データ行が存在しません。');
        }

        const dataRows = rows
          .slice(1)
          .map((row) => row.map((cell) => sanitize(cell)))
          .filter((row) => row.some((cell) => cell.length > 0));

        const withUrl = dataRows.filter((row) => row[4]?.length > 0);
        const truncated = withUrl.slice(0, MAX_COMPANY_ROWS);

        const skippedMissingUrl = dataRows.length - withUrl.length;
        const skippedByLimit = Math.max(withUrl.length - truncated.length, 0);

        const nextCards = truncated.map((row) => ({
          ...createEmptyCard(),
          companyName: deriveCompanyNameFromUrl(row[4] ?? ''),
          contactName: row[0] ?? '',
          department: row[1] ?? '',
          title: row[2] ?? '',
          email: row[3] ?? '',
          homepageUrl: normalizeHomepageUrl(row[4] ?? ''),
        }));

        setCards(nextCards);
        enqueueGeneration(
          nextCards.map((card) => card.id),
          true
        );
        setUploadState({
          fileName: file.name,
          importedCount: nextCards.length,
          skippedCount: skippedMissingUrl + skippedByLimit,
          lastImportedAt: Date.now(),
        });
        setLogs((prev) => [
          ...prev,
          `Excel読み込み: ${nextCards.length}件をカード化し、自動生成を開始しました。`,
        ]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Excelの読み込みに失敗しました。';
        setUploadState((prev) => ({
          ...prev,
          error: message,
        }));
        setLogs((prev) => [...prev, `Excel読み込みエラー: ${message}`]);
      }
    },
    [enqueueGeneration]
  );

  const handleGenerateEntry = useCallback(
    async (cardId: string) => {
      const target = cards.find((card) => card.id === cardId);
      if (!target) {
        throw new Error('対象のカードが見つかりませんでした。');
      }

      if (!target.homepageUrl.trim()) {
        const message = 'ホームページURLは必須です。';
        setCards((prev) =>
          prev.map((card) =>
            card.id === cardId
              ? { ...card, status: 'error', errorMessage: message }
              : card
          )
        );
        throw new Error(message);
      }

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? { ...card, status: 'generating', errorMessage: undefined }
            : card
        )
      );

      const baseUrl =
        typeof window !== 'undefined' ? window.location.origin : '';
      const attachments = Object.values(target.attachments).map((link) => ({
        name:
          pdfAssets.find((asset) => asset.id === link.pdfId)?.name ?? '添付資料',
        url: `${baseUrl}${link.url}`,
        token: link.token,
      }));

      const response = await fetch('/api/ai/sales-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderProfile,
          recipient: {
            companyName: target.companyName,
            contactName: target.contactName,
            department: target.department,
            title: target.title,
            email: target.email,
            homepageUrl: target.homepageUrl,
          },
          attachments,
          notes: target.notes,
          tone: 'friendly',
          language: 'ja',
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        const message =
          (typeof payload?.message === 'string' && payload.message) ||
          'AI生成に失敗しました。';
        setCards((prev) =>
          prev.map((card) =>
            card.id === cardId
              ? { ...card, status: 'error', errorMessage: message }
              : card
          )
        );
        throw new Error(message);
      }

      const message =
        (typeof payload?.message === 'string' && payload.message.trim()) || '';

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId
            ? {
                ...card,
                generatedMessage: message,
                status: 'ready',
                errorMessage: undefined,
              }
            : card
        )
      );
      setLogs((prev) => [
        ...prev,
        `✅ ${target.companyName || target.contactName || target.homepageUrl} の文面を生成 (${message.length}文字)`,
      ]);
    },
    [cards, pdfAssets, senderProfile]
  );

  useEffect(() => {
    if (queueState.running) return;
    const nextId = queueState.pendingIds[0];
    if (!nextId) return;

    setQueueState((prev) => ({ ...prev, running: true, error: undefined }));
    void handleGenerateEntry(nextId)
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : String(error ?? '不明なエラー');
        setLogs((prev) => [...prev, `⚠️ ${message}`]);
        setQueueState((prev) => ({ ...prev, error: message }));
      })
      .finally(() => {
        setQueueState((prev) => ({
          ...prev,
          running: false,
          pendingIds: removeFromQueue(prev.pendingIds, nextId),
          lastProcessed: nextId,
        }));
      });
  }, [handleGenerateEntry, queueState.pendingIds, queueState.running]);

  const handleQueuePendingCards = useCallback(() => {
    const pendingIds = cards
      .filter((card) => card.status !== 'ready' && card.homepageUrl.trim())
      .map((card) => card.id);
    if (!pendingIds.length) {
      setLogs((prev) => [...prev, '未生成カードがありません。']);
      return;
    }
    enqueueGeneration(pendingIds, true);
    setLogs((prev) => [
      ...prev,
      `🌀 ${pendingIds.length}件を自動生成キューに設定しました。`,
    ]);
  }, [cards, enqueueGeneration]);

  const handleSimulateSend = useCallback(async () => {
    if (!sendableCards.length) {
      setLogs((prev) => [...prev, '送信対象のカードがありません。']);
      return;
    }
    setIsSending(true);
    setLogs((prev) => [...prev, '🚀 一括送信モックを開始しました。']);

    try {
      const payload: AiWorkflowRequest = {
        sender: senderProfile,
        entries: sendableCards.map((card) => ({
          id: card.id,
          homepageUrl: card.homepageUrl,
          recipient: {
            companyName: card.companyName,
            contactName: card.contactName,
            department: card.department,
            title: card.title,
            email: card.email,
            homepageUrl: card.homepageUrl,
          },
          generatedMessage: card.generatedMessage,
          sendEnabled: card.sendEnabled,
          attachmentCount: Object.keys(card.attachments).length,
        })),
      };

      const result = await simulateAiWorkflow(payload);
      setLogs((prev) => [...prev, ...result.logs]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '送信モックに失敗しました。';
      setLogs((prev) => [...prev, `⚠️ ${message}`]);
    } finally {
      setIsSending(false);
    }
  }, [sendableCards, senderProfile]);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleExcelUpload(file);
      }
      event.target.value = '';
    },
    [handleExcelUpload]
  );

  const handlePdfInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      handlePdfUpload(files);
      event.target.value = '';
    },
    [handlePdfUpload]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            apotto
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            AIカスタム文面生成
          </h1>
          <p className="text-base text-slate-600">
            Excel/CSVで最大100社を取り込み、送信者情報と相手企業情報を明確に分離したままAIにプロンプトを投げます。
            ホームページURLが必須で、取り込み後は順番に自動生成を開始します。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="登録カード" value={`${cards.length}社`} />
            <StatCard
              label="送信対象 (ON)"
              value={`${sendableCards.length}社`}
              helper="各カード右上のチェックで切替"
            />
            <StatCard
              label="送信準備OK"
              value={`${sendableReadyCards.length}社`}
              helper="チェックONかつ生成済み"
            />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  SECTION 01
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  自社情報（送信者）
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                必須: {REQUIRED_SENDER_FIELDS.join(', ')}
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InputField
                label="会社名 *"
                value={senderProfile.companyName}
                onChange={(value) => handleSenderProfileChange('companyName', value)}
              />
              <InputField
                label="部署"
                value={senderProfile.department}
                onChange={(value) => handleSenderProfileChange('department', value)}
              />
              <InputField
                label="役職"
                value={senderProfile.title}
                onChange={(value) => handleSenderProfileChange('title', value)}
              />
              <InputField
                label="担当者名 *"
                value={senderProfile.fullName}
                onChange={(value) => handleSenderProfileChange('fullName', value)}
              />
              <InputField
                label="メールアドレス *"
                type="email"
                value={senderProfile.email}
                onChange={(value) => handleSenderProfileChange('email', value)}
              />
              <InputField
                label="電話番号"
                value={senderProfile.phone}
                onChange={(value) => handleSenderProfileChange('phone', value)}
              />
            </div>
            <InputField
              className="mt-4"
              label="件名 *"
              value={senderProfile.subject}
              onChange={(value) => handleSenderProfileChange('subject', value)}
            />
            {senderMissingFields.length > 0 && (
              <p className="mt-3 text-sm text-rose-500">
                送信者情報の必須項目が不足しています: {senderMissingFields.join(', ')}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  SECTION 02
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Excel / CSV 取り込み
                </h2>
              </div>
              <button
                type="button"
                onClick={handleManualCardAdd}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800"
              >
                カードを追加
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              1列目: 担当者名 / 2列目: 部署 / 3列目: 役職 / 4列目: メール / 5列目: ホームページURL（必須）。
              100社まで取り込み、読込完了後は自動的に生成キューへ投入します。
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center hover:border-slate-400">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-700">
                ファイルを選択またはドロップ
              </span>
              <span className="mt-1 text-xs text-slate-500">
                .xlsx / .xls / .csv 対応
              </span>
            </label>
            {uploadState.fileName && (
              <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{uploadState.fileName}</p>
                <p>
                  取り込み {uploadState.importedCount} 件 / スキップ{' '}
                  {uploadState.skippedCount} 件
                </p>
              </div>
            )}
            {uploadState.error && (
              <p className="mt-3 text-sm text-rose-500">{uploadState.error}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleQueuePendingCards}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                未生成カードを再キュー
              </button>
              <button
                type="button"
                onClick={handleClearCards}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                カードをリセット
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                SECTION 03
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                PDFライブラリとトラッキングURL
              </h2>
            </div>
            <label className="rounded-full border border-slate-200 bg-slate-900/90 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">
              PDFを追加
              <input
                type="file"
                accept=".pdf"
                className="sr-only"
                multiple
                onChange={handlePdfInputChange}
              />
            </label>
          </div>
          {pdfAssets.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              まだPDFが登録されていません。AI文面から添付リンクを生成する場合はPDFをアップロードしてください。
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {pdfAssets.map((pdf) => (
                <li key={pdf.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{pdf.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(pdf.size)} / {new Date(pdf.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePdfRemove(pdf.id)}
                    className="text-sm text-rose-500 hover:text-rose-600"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                SECTION 04
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                企業カード一覧
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {sendableReadyCards.length} / {sendableCards.length} 社が送信条件を満たしています
            </p>
          </div>
          {cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              Excelを取り込むか「カードを追加」ボタンで手動追加してください。
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cards.map((card) => {
                const attachmentList = Object.values(card.attachments);
                return (
                  <div
                    key={card.id}
                    className="relative rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
                    aria-busy={card.status === 'generating'}
                    aria-disabled={card.status === 'generating'}
                  >
                    {card.status === 'generating' && (
                      <div className="absolute inset-0 z-10 rounded-2xl bg-white/60 backdrop-blur-[1px]" />
                    )}
                    {card.status === 'generating' && (
                      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 ring-1 ring-slate-200">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                          <span className="text-sm font-medium text-slate-800">AI生成中…</span>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={card.sendEnabled}
                          onChange={() => handleToggleSendEnabled(card.id)}
                          disabled={card.status === 'generating'}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-900">
                          送信対象
                        </span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {card.homepageUrl || 'URL未入力'}
                      </span>
                      <StatusBadge status={card.status} />
                      {card.errorMessage && (
                        <span className="text-sm text-rose-500">{card.errorMessage}</span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InputField
                        label="相手企業名"
                        value={card.companyName}
                        placeholder="例: 株式会社◯◯"
                        onChange={(value) =>
                          handleCardFieldChange(card.id, 'companyName', value)
                        }
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="担当者名"
                        value={card.contactName}
                        placeholder="例: 山田様"
                        onChange={(value) =>
                          handleCardFieldChange(card.id, 'contactName', value)
                        }
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="部署"
                        value={card.department}
                        onChange={(value) =>
                          handleCardFieldChange(card.id, 'department', value)
                        }
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="役職"
                        value={card.title}
                        onChange={(value) => handleCardFieldChange(card.id, 'title', value)}
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="担当者メール"
                        type="email"
                        value={card.email}
                        onChange={(value) => handleCardFieldChange(card.id, 'email', value)}
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="ホームページURL *"
                        value={card.homepageUrl}
                        onChange={(value) =>
                          handleCardFieldChange(
                            card.id,
                            'homepageUrl',
                            normalizeHomepageUrl(value)
                          )
                        }
                        disabled={card.status === 'generating'}
                      />
                      <InputField
                        label="備考 / 追加メモ"
                        value={card.notes}
                        onChange={(value) => handleCardFieldChange(card.id, 'notes', value)}
                        disabled={card.status === 'generating'}
                      />
                    </div>

                    {pdfAssets.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-800">添付PDF</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {pdfAssets.map((pdf) => (
                            <label
                              key={pdf.id}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(card.attachments[pdf.id])}
                                onChange={(event) =>
                                  handleAttachmentToggle(card.id, pdf.id, event.target.checked)
                                }
                                disabled={card.status === 'generating'}
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                              />
                              {pdf.name}
                            </label>
                          ))}
                        </div>
                        {attachmentList.length > 0 && (
                          <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                            {attachmentList.map((attachment) => (
                              <p key={attachment.token} className="break-all">
                                {attachment.url}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800">生成された文面</p>
                        <button
                          type="button"
                          onClick={() => void handleGenerateEntry(card.id)}
                          disabled={card.status === 'generating'}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          このカードを生成
                        </button>
                      </div>
                      <textarea
                        value={card.generatedMessage}
                        onChange={(event) =>
                          handleMessageChange(card.id, event.target.value)
                        }
                        rows={6}
                        placeholder="AI生成結果がここに表示されます。"
                        disabled={card.status === 'generating'}
                        className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                          card.status === 'generating'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  SECTION 05
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  自動生成キュー
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {queueState.pendingIds.length} 件待機中
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <p>
                状態:{' '}
                <span className="font-medium">
                  {queueState.running ? '生成中' : '待機中'}
                </span>
              </p>
              <p>直近の完了: {queueState.lastProcessed || '-'}</p>
              {queueState.error && (
                <p className="text-rose-500">エラー: {queueState.error}</p>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleQueuePendingCards}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                未生成を再投入
              </button>
              <button
                type="button"
                onClick={clearQueue}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                キューを停止
              </button>
            </div>
            <button
              type="button"
              onClick={handleSimulateSend}
              disabled={isSending || sendableCards.length === 0}
              className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSending ? '送信モック実行中...' : 'チェック済み企業を一括送信 (モック)'}
            </button>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  SECTION 06
                </p>
                <h2 className="text-lg font-semibold text-slate-900">ログ</h2>
              </div>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                クリア
              </button>
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm text-slate-700">
              {logs.length === 0 ? (
                <p className="text-slate-500">まだログはありません。</p>
              ) : (
                logs.map((log, index) => (
                  <p key={`${log}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
          disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-900'
        }`}
      />
    </label>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: CompanyCard['status'] }) {
  const label =
    status === 'ready'
      ? 'READY'
      : status === 'generating'
      ? 'GENERATING'
      : status === 'error'
      ? 'ERROR'
      : 'PENDING';
  const color =
    status === 'ready'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'generating'
      ? 'bg-amber-50 text-amber-700'
      : status === 'error'
      ? 'bg-rose-50 text-rose-700'
      : 'bg-slate-100 text-slate-600';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

function createDefaultSenderProfile(): SenderProfile {
  return {
    companyName: '',
    department: '',
    title: '',
    fullName: '',
    email: '',
    phone: '',
    subject: '',
  };
}

function createEmptyCard(): CompanyCard {
  return {
    id: crypto.randomUUID(),
    companyName: '',
    contactName: '',
    department: '',
    title: '',
    email: '',
    homepageUrl: '',
    notes: '',
    generatedMessage: '',
    status: 'pending',
    sendEnabled: true,
    attachments: {},
  };
}

function sanitize(value: unknown): string {
  if (typeof value === 'number') return String(value).trim();
  if (typeof value !== 'string') return '';
  return value.trim();
}

function deriveCompanyNameFromUrl(url: string): string {
  try {
    const parsed = new URL(normalizeHomepageUrl(url));
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function normalizeHomepageUrl(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function readSheetRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('シートが見つかりません。');
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
  }) as string[][];
  return rows;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTrackingLink(cardId: string, pdfId: string): TrackingLink {
  const token = `${cardId}-${pdfId}-${crypto.randomUUID()}`;
  return {
    pdfId,
    token,
    url: `/pdf/${token}`,
  };
}

function removeFromQueue(queue: string[], target: string): string[] {
  const index = queue.indexOf(target);
  if (index === -1) return queue;
  return [...queue.slice(0, index), ...queue.slice(index + 1)];
}

