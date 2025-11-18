/**
 * OpenAI API の疎通確認スクリプト
 *
 * 実行方法:
 *   yarn node ./scripts/check-openai.mjs
 *
 * 出力:
 *   - 必須環境変数の有無
 *   - モデル一覧エンドポイントのHTTPステータス
 *   - 成功時は利用可能な最初のモデルID
 *   - 失敗時はエラーメッセージ
 */

const REQUIRED_ENV = ['OPENAI_API_KEY'];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `以下の環境変数が未設定です: ${missing.join(', ')} ( .env.local などを確認してください )`
    );
  }
}

async function checkModelsEndpoint() {
  const baseUrl = process.env.OPENAI_API_URL
    ? process.env.OPENAI_API_URL.replace(/\/responses$/, '')
    : 'https://api.openai.com/v1';
  const url = `${baseUrl}/models`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const bodyText = await response.text();
  let bodyJson;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    bodyJson = bodyText;
  }

  return { status: response.status, ok: response.ok, body: bodyJson, url };
}

async function main() {
  try {
    assertEnv();
    console.log('✅ 必須環境変数: OK');
  } catch (error) {
    console.error('❌ 環境変数エラー:', error.message);
    process.exitCode = 1;
    return;
  }

  try {
    console.log('⏳ OpenAI モデル一覧 API へ疎通確認中...');
    const result = await checkModelsEndpoint();
    console.log(`📡 リクエスト: ${result.url}`);
    console.log(`📥 ステータス: ${result.status}`);
    if (result.ok) {
      const models = Array.isArray(result.body?.data) ? result.body.data : [];
      console.log(`✅ 疎通成功: モデル件数 ${models.length}`);
      if (models.length > 0) {
        console.log('📃 利用可能モデル一覧:');
        models.forEach((model, index) => {
          const label = model?.id ?? '(unknown)';
          console.log(`  ${String(index + 1).padStart(2, ' ')}. ${label}`);
        });
      }
    } else {
      const message =
        result.body?.error?.message ??
        result.body?.message ??
        JSON.stringify(result.body);
      console.error('❌ 疎通失敗:', message);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('❌ リクエスト例外:', error);
    process.exitCode = 1;
  }
}

await main();

