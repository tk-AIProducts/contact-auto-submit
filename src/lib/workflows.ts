/**
 * タブ別ワークフローのモック実装。
 *
 * 将来的にはここをPlaywright / AI / メール送信の本処理に差し替える。
 * 現段階ではUI検証用にモックレスポンスを返す。
 */

type MaybeString = string | undefined;

export type SharedContactPayload = {
  company?: MaybeString;
  person?: MaybeString;
  name?: MaybeString;
  email?: MaybeString;
  phone?: MaybeString;
  subject?: MaybeString;
  message?: MaybeString;
  debug?: boolean;
};

export type BulkWorkflowRequest = {
  urls: string[];
  shared: SharedContactPayload;
};

export type SenderProfilePayload = {
  companyName?: MaybeString;
  department?: MaybeString;
  title?: MaybeString;
  fullName?: MaybeString;
  email?: MaybeString;
  phone?: MaybeString;
  subject?: MaybeString;
};

export type RecipientProfilePayload = {
  companyName?: MaybeString;
  contactName?: MaybeString;
  department?: MaybeString;
  title?: MaybeString;
  email?: MaybeString;
  homepageUrl: string;
};

export type AiWorkflowEntry = {
  id: string;
  homepageUrl: string;
  recipient: RecipientProfilePayload;
  generatedMessage?: MaybeString;
  sendEnabled: boolean;
  attachmentCount: number;
};

export type AiWorkflowRequest = {
  sender: SenderProfilePayload;
  entries: AiWorkflowEntry[];
};

export type EmailWorkflowRequest = {
  recipients: string[];
  subject: string;
  body: string;
  attachmentUrls: string[];
  reminderIntervalDays: number;
};

export type WorkflowSimulationResult = {
  success: boolean;
  logs: string[];
  note: string;
  meta?: Record<string, unknown>;
};

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function simulateBulkWorkflow(
  req: BulkWorkflowRequest
): Promise<WorkflowSimulationResult> {
  await delay(320);
  const count = req.urls.length;
  const logs = [
    'モック: 共通文面一括送信を初期化',
    `URL一覧を読み込み: ${count}件`,
    `会社名: ${req.shared.company || '(未設定)'}`,
    `1件目のフォーム探索・入力・送信（想定）`,
    '残りのURLは省略...',
    '完了: モックシーケンス終了',
  ];
  return {
    success: count > 0,
    logs,
    note: `モック完了: ${count}件を処理 (Playwright未接続)`,
    meta: { debug: !!req.shared.debug },
  };
}

export async function simulateAiWorkflow(
  req: AiWorkflowRequest
): Promise<WorkflowSimulationResult> {
  await delay(420);
  const total = req.entries.length;
  const enabled = req.entries.filter((entry) => entry.sendEnabled);
  const ready = enabled.filter((entry) => entry.generatedMessage?.trim()).length;
  const pending = enabled.length - ready;

  const logs = [
    'モック: AIカスタム文面送信ワークフローを初期化',
    `登録カード: ${total}件 / 送信対象: ${enabled.length}件`,
    `生成済み (送信対象内): ${ready}件`,
    `未生成 (送信対象内): ${pending}件`,
    `平均添付数: ${
      enabled.length
        ? (
            enabled.reduce((sum, entry) => sum + entry.attachmentCount, 0) /
            enabled.length
          ).toFixed(1)
        : '0.0'
    } 件`,
    enabled.length
      ? 'Playwright投入キューとPDFトラッキング登録をモック実行'
      : '送信対象がないためキュー投入をスキップ',
    '完了: モックシーケンス終了',
  ];

  return {
    success: enabled.length > 0 && ready === enabled.length,
    logs,
    note: `モック完了: 送信対象 ${enabled.length}件中 ${ready}件が送信可能状態`,
    meta: { ready, pending, enabled: enabled.length, total },
  };
}

export async function simulateEmailWorkflow(
  req: EmailWorkflowRequest
): Promise<WorkflowSimulationResult> {
  await delay(380);
  const count = req.recipients.length;
  const logs = [
    'モック: 資料送付メールワークフローを初期化',
    `宛先件数: ${count}件`,
    `件名: ${req.subject || '(未設定)'}`,
    `添付URL数: ${req.attachmentUrls.filter((url) => !!url).length}件`,
    `リマインド間隔: ${req.reminderIntervalDays}日ごと / 最大2回を予約 (モック)`,
    '完了: メール送信・トラッキング登録 (モック)',
  ];
  return {
    success: count > 0 && !!req.subject && !!req.body,
    logs,
    note: `モック完了: ${count}件に送信予約を設定 (実送信は未接続)`,
  };
}


