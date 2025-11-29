'use client';

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-100">


      {/* Links */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 会社情報 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">会社情報</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://voiq.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  運営会社
                </a>
              </li>
            </ul>
          </div>

          {/* サービス */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">サービス</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#features" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  機能紹介
                </a>
              </li>
              <li>
                <a href="#steps" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  ご利用の流れ
                </a>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">サポート</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="#contact" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  お問い合わせ
                </a>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">法的情報</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://voiq.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a
                  href="https://voiq.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  利用規約
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-600">apotto</span>
            <span className="text-xs text-slate-400">by</span>
            <a
              href="https://voiq.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              VOIQ Inc.
            </a>
          </div>
          <p className="mt-4 md:mt-0 text-xs text-slate-500">
            &copy; 2025 VOIQ Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

