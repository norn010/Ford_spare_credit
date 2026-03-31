import { useEffect, useMemo, useState } from 'react';
import {
  fetchAutomateQueue,
  createDebtClearingBatch,
} from '../services/api';

const initialBatchForm = {
  rs_docno: '',
  fee: '',
  diff_debit: '',
  diff_credit: '',
  bank_statement: 'confirm',
};

function AutomateCompleted() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState(initialBatchForm);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const selectedBatchRows = useMemo(
    () => rows.filter((r) => selectedRows.has(r.id)),
    [rows, selectedRows],
  );

  const selectedNetTotal = useMemo(
    () => selectedBatchRows.reduce((sum, r) => sum + (r['ราคารวมภาษี'] != null ? Number(r['ราคารวมภาษี']) : 0), 0),
    [selectedBatchRows],
  );

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAutomateQueue({
        status: 'เสร็จแล้ว',
      });
      setRows(data);
    } catch (err) {
      setError('Failed to load completed automation queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return sortAsc ? 1 : -1;
      if (vb == null) return sortAsc ? -1 : 1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      const cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortKey, sortAsc]);

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function toggleRowSelection(id) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = sortedRows.length > 0 && sortedRows.every((r) => selectedRows.has(r.id));
  function toggleSelectAll() {
    if (allSelected) {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        sortedRows.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedRows((prev) => {
        const next = new Set(prev);
        sortedRows.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  async function handleCreateBatch() {
    if (selectedBatchRows.length === 0) return;
    const first = selectedBatchRows[0];

    const payload = {
      database_name: 'Ford_Spare_Credit',
      branch: first['สาขา'] ?? '',
      รหัสลูกค้า: first['รหัสลูกค้า'] ?? null,
      rs_docno: batchForm.rs_docno.trim(),
      fee: batchForm.fee === '' ? null : Number(batchForm.fee),
      diff_debit: batchForm.diff_debit === '' ? null : Number(batchForm.diff_debit),
      diff_credit: batchForm.diff_credit === '' ? null : Number(batchForm.diff_credit),
      bank_statement: batchForm.bank_statement || 'confirm',
      rows: selectedBatchRows.map((r) => ({
        id: r.id,
        Brand: r.Brand ?? 'Ford',
        invoice_no: r['เลขที่ใบกำกับภาษี'] ?? '',
        amount: r['ราคารวมภาษี'] != null ? Number(r['ราคารวมภาษี']) : null,
      })),
    };
    setBatchSubmitting(true);
    setError(null);
    try {
      await createDebtClearingBatch(payload);
      setRows((prev) => prev.filter((r) => !selectedRows.has(r.id)));
      setSelectedRows(new Set());
      setShowBatchModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create batch.');
    } finally {
      setBatchSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-8 p-4 md:p-8">
      <header className="shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">รายการที่ Automate สำเร็จ</h1>
          <p className="text-slate-500 font-medium text-lg">
            แสดงข้อมูลอะไหล่เงินเชื่อที่ระบบประมวลผลเสร็จสิ้นและพร้อมสร้างรายงานตัดชำระ
          </p>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="shrink-0 border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-800">Queue เสร็จแล้ว</h2>
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              disabled={selectedRows.size === 0}
              className="px-6 py-2 rounded-xl text-sm font-extrabold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              สร้างรายการตัดชำระ (Selected: {selectedRows.size})
            </button>
          </div>
          <p className="text-sm font-bold text-slate-500">
            {loading ? 'กำลังโหลด...' : `${rows.length.toLocaleString()} รายการทั้งหมด`}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                {[
                  ['Brand', 'Brand'],
                  ['สาขา', 'สาขา'],
                  ['เลขที่ใบกำกับภาษี', 'เลขที่ใบกำกับภาษี'],
                  ['วันที่ใบกำกับภาษี', 'วันที่ใบกำกับภาษี'],
                  ['รหัสลูกค้า', 'รหัสลูกค้า'],
                  ['ชื่อลูกค้า', 'ชื่อลูกค้า'],
                  ['มูลค่าสินค้า', 'มูลค่าสินค้า'],
                  ['ภาษีมูลค่าเพิ่ม', 'ภาษีมูลค่าเพิ่ม'],
                  ['ราคารวมภาษี', 'ราคารวมภาษี'],
                  ['ต้นทุน', 'ต้นทุน'],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className="px-6 py-4 font-extrabold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors text-left"
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      {sortKey === key && (
                        <span className="text-[10px]">{sortAsc ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.map((row) => (
                <tr key={row.id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row['Brand'] === 'Ford' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                      {row['Brand'] || 'Ford'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{row['สาขา']}</td>
                  <td className="px-6 py-4 font-bold text-primary-700">{row['เลขที่ใบกำกับภาษี']}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {row['วันที่ใบกำกับภาษี'] ? new Date(row['วันที่ใบกำกับภาษี']).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{row['รหัสลูกค้า']}</td>
                  <td className="px-6 py-4 text-slate-700 truncate max-w-[200px]" title={row['ชื่อลูกค้า']}>
                    {row['ชื่อลูกค้า']}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {row['มูลค่าสินค้า']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {row['ภาษีมูลค่าเพิ่ม']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {row['ราคารวมภาษี']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-rose-600">
                    {row['ต้นทุน']?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-20 text-center text-slate-400 font-medium" colSpan={10}>
                    ไม่พบข้อมูลที่เสร็จแล้ว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">สร้างรายการตัดชำระ (Batch)</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              ยืนยันการรวมรายการ {selectedRows.size} แถว เข้าสู่ระบบบัญชี
            </p>

            <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">ยอดรวมสุทธิ</div>
              <div className="text-3xl font-black text-emerald-700">
                ฿{selectedNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">RS Document No</label>
                <input
                  type="text"
                  value={batchForm.rs_docno}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, rs_docno: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="เช่น RS6902-004(เฉพาะตัวเลข)"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">หักค่าธรรมเนียม</label>
                <input
                  type="number"
                  value={batchForm.fee}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, fee: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ส่วนต่าง เดบิต</label>
                  <input
                    type="number"
                    value={batchForm.diff_debit}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, diff_debit: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">ส่วนต่าง เครดิต</label>
                  <input
                    type="number"
                    value={batchForm.diff_credit}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, diff_credit: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-1.5 ml-1">รายการใบกำกับภาษี</label>
                <div className="max-h-32 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <ul className="text-xs font-bold text-slate-600 space-y-1">
                    {selectedBatchRows.map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span>{r['เลขที่ใบกำกับภาษี']}</span>
                        <span className="text-slate-400">฿{r['ราคารวมภาษี']?.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="flex-1 px-4 py-4 rounded-xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBatch}
                disabled={batchSubmitting || !batchForm.rs_docno.trim()}
                className="flex-[2] bg-primary-600 text-white font-black py-4 rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {batchSubmitting ? 'Processing...' : 'Create Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomateCompleted;

