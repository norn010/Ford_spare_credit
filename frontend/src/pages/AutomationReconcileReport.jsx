import { useEffect, useState } from 'react';
import { fetchReconcileBatches, fetchDebtBatchDetails } from '../services/api';

function AutomationReconcileReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReconcileBatches({});
        setRows(data);
      } catch (err) {
        setError('Failed to load reconcile batch report.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleShowDetails(batch) {
    setSelectedBatch(batch);
    setLoadingDetails(true);
    try {
      const data = await fetchDebtBatchDetails(batch.id);
      setDetails(data);
    } catch (err) {
      console.error('Failed to fetch details');
    } finally {
      setLoadingDetails(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6 p-4 md:p-8 bg-slate-50/50">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            รายงานตัดชำระหนี้ (Automation)
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            แสดงรายการจาก `Debt_batch` ที่กำลังดำเนินการ
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200 text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ทั้งหมด</div>
            <div className="text-xl font-black text-slate-700">
              {loading ? '...' : rows.length.toLocaleString()} <span className="text-sm font-medium text-slate-400">รายการ</span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="shrink-0 border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/30">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            รายการ Batch ปัจจุบัน
          </h2>
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/50 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-md">
              <tr>
                {[
                  ['id', 'ID'],
                  ['Brand', 'ยี่ห้อ'],
                  ['สาขา', 'สาขา'],
                  ['rs_docno', 'RS DOC NO'],
                  ['fee', 'ค่าธรรมเนียม'],
                  ['diff_debit', 'ส่วนต่าง (D)'],
                  ['diff_credit', 'ส่วนต่าง (C)'],
                  ['automate_status', 'สถานะ'],
                  ['รหัสลูกค้า', 'รหัสลูกค้า'],
                  ['ยอดรวมสุทธิ', 'ยอดรวมสุทธิ'],
                  ['actions', 'จัดการ'],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className="px-6 py-4 font-black text-slate-500 text-left uppercase tracking-wider text-[11px]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-primary-50/30 transition-all group"
                >
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">#{row.id}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.Brand === 'Ford' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                      {row.Brand || 'Ford'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{row['สาขา'] ?? '-'}</td>
                  <td className="px-6 py-4 font-bold text-primary-700">{row.rs_docno}</td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.fee != null ? Number(row.fee).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.diff_debit != null ? Number(row.diff_debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-rose-500">
                    {row.diff_credit != null ? Number(row.diff_credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight">
                      {row.automate_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{row['รหัสลูกค้า']}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                    {row['ยอดรวมสุทธิ'] != null
                      ? Number(row['ยอดรวมสุทธิ']).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleShowDetails(row)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-primary-600 border border-primary-200 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm active:scale-95"
                    >
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    className="px-6 py-20 text-center text-slate-400 font-bold"
                    colSpan={11}
                  >
                    ไม่พบรายการที่กำลังดำเนินการ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <header className="shrink-0 px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">รายละเอียด Batch #{selectedBatch.id}</h3>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-0.5">RS: {selectedBatch.rs_docno}</p>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm border border-slate-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar">
              {loadingDetails ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold text-slate-400">กำลังโหลดรายละเอียด...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">รหัสลูกค้า</div>
                      <div className="text-sm font-bold text-slate-700">{selectedBatch['รหัสลูกค้า']}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">ยอดรวมสุทธิ</div>
                      <div className="text-lg font-black text-emerald-700">฿{Number(selectedBatch['ยอดรวมสุทธิ']).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-black text-slate-500">เลขที่ใบกำกับภาษี</th>
                          <th className="px-4 py-3 text-right font-black text-slate-500">ราคารวมภาษี</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {details.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-700">{d['เลขที่ใบกำกับภาษี']}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary-600 tabular-nums">
                              ฿{Number(d['ราคารวมภาษี']).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationReconcileReport;

