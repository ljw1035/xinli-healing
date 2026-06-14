import React from 'react';
import { Shield, Database, Lock, AlertTriangle, Phone } from 'lucide-react';

interface PrivacyModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onAccept, onDecline }) => {
  const handleAccept = () => {
    const checked = (document.getElementById('privacy-check') as HTMLInputElement)?.checked;
    if (!checked) {
      alert('请先勾选同意框，再点击「同意并继续」');
      return;
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* 顶部装饰 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <Shield className="w-7 h-7" />
            <div>
              <h3 className="font-bold text-lg">隐私与数据保护声明</h3>
              <p className="text-xs opacity-90 mt-0.5">请阅读并同意后再开始使用</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700 max-h-[60vh] overflow-y-auto">
          <div className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Database className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-indigo-900 text-xs mb-1">📦 数据存储方式</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                本应用所有对话记录、评估结果、工具使用数据均<strong>完全存储在您的本地浏览器</strong>（localStorage）中，不会上传至任何服务器。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Lock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-900 text-xs mb-1">🔒 隐私保护承诺</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                我们<strong>不收集、不传输、不分享</strong>您的任何个人信息。您的对话内容只有您自己能看到。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900 text-xs mb-1">⚠️ 重要免责声明</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                本系统<strong>不能替代专业的医学诊断、精神科药物处方或专业线下心理治疗</strong>。如您正在经历严重的心理困扰，请及时联系专业心理医生或拨打危机干预热线。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
            <Phone className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-900 text-xs mb-1">📞 危机干预资源</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                如您有自杀或自伤倾向，请立即拨打：<br/>
                <strong>北京回龙观医院危机干预热线：800-810-1117</strong><br/>
                <strong>希望24小时热线：400-161-9995</strong>
              </p>
            </div>
          </div>

          <label className="flex items-start space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <input type="checkbox" id="privacy-check" className="mt-0.5 accent-indigo-600" />
            <span className="text-xs text-slate-600 leading-relaxed">
              我已阅读并理解上述声明，同意在使用本应用时<strong>所有数据仅存储在本地</strong>，并知晓本工具不能替代专业心理治疗。
            </span>
          </label>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onDecline}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl text-sm transition-colors"
          >
            暂不使用
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all"
          >
            ✅ 同意并继续
          </button>
        </div>
      </div>
    </div>
  );
};
