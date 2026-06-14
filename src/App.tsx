import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { apiService } from './services/apiService';
import { Heart, Key, Shield, Info, Lightbulb, TrendingUp, ClipboardList, Moon, Sun } from 'lucide-react';

export const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(apiService.getApiKey());
  const [apiUrl, setApiUrl] = useState(apiService.getApiBaseUrl());
  const [showKeyConfig, setShowKeyConfig] = useState(!apiService.getApiKey());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [triggerTool, setTriggerTool] = useState<string | null>(null);

  // 工具快捷触发映射
  const toolTriggers: Record<string, string> = {
    mood: '我想做一个心情温度计评分',
    breathing: '我最近感觉很紧张，想试试呼吸放松训练',
    gad7: '我最近总是感到焦虑和担心，想做一个焦虑评估',
    act: '我感觉很内耗和迷茫，不知道自己真正在意什么',
    cbt: '我脑子里总有很多消极的想法，想试着识别和挑战它们',
    sfbt: '我总觉得什么都做不好，想找一些例外和资源',
    diary: '我想写一篇情绪日记记录今天的心情',
  };

  const handleToolClick = (toolKey: string) => {
    setTriggerTool(toolTriggers[toolKey] || '');
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('xinli_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('xinli_theme', 'light');
    }
  }, [isDarkMode]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    apiService.setApiKey(apiKey, apiUrl);
    setShowKeyConfig(false);
  };

  const handleClearKey = () => {
    apiService.clearSettings();
    setApiKey('');
    setApiUrl('https://api.deepseek.com/v1');
    setShowKeyConfig(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#F4F6F7] via-[#EAF2F8] to-[#F4F6F7] text-[#2C3E50] font-sans antialiased flex flex-col md:flex-row h-screen overflow-hidden dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
      {/* 左侧引导面板 / 说明书 */}
      <div className="w-full md:w-80 lg:w-96 bg-white/60 backdrop-blur-md border-r border-slate-200/50 p-6 flex flex-col justify-between shrink-0 overflow-y-auto dark:bg-slate-800/60 dark:border-slate-700/50">
        <div className="space-y-6">
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/15">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-wide flex items-center dark:text-slate-100">
                心声疗愈 <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded dark:bg-indigo-900/50 dark:text-indigo-300">v2.0 ✅</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium dark:text-slate-500">专业的 AI 循证心理辅导智能体</p>
            </div>
          </div>

          <hr className="border-slate-200/60" />

          {/* 量化评估 */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100/50 space-y-1.5">
            <h4 className="text-xs font-bold text-purple-700 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600 mr-1.5" />
              量化评估与前后对比
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              智能体在对话开始时会引导你做<code className="text-purple-600 bg-purple-50 font-bold px-1 rounded">心情温度计</code>评分（1-10分）。在调用工具干预后，会再次评估情绪状态，并展示<strong>前后改善对比</strong>效果。
            </p>
          </div>

          {/* 七大工具快捷触发提示 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider flex items-center">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
              工具测试与触发指南（7大工具）
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              智能体在对话中会自动识别并按需调用以下心理学工具。<span className="text-blue-600 font-semibold">👆 点击下方卡片即可快速触发</span>，也可以发送含有关键字的消息来主动调用：
            </p>

            <div className="space-y-2.5">
              {/* 工具0：自评温度计 */}
              <div 
                className="p-3 bg-purple-50/40 hover:bg-purple-100/60 rounded-xl border border-purple-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('mood')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-purple-700">🌡️ 情绪自评温度计 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-purple-500 bg-purple-100/60 px-1.5 py-0.2 rounded font-semibold">量化评估</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  对话初始及干预后出现，1-10分情绪量化自评，形成<strong>前后对比</strong>。
                </p>
              </div>

              {/* 工具1：呼吸放松 */}
              <div 
                className="p-3 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl border border-blue-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('breathing')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-700">🧘 工具 1：呼吸放松训练 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-blue-500 bg-blue-100/60 px-1.5 py-0.2 rounded font-semibold">生理调节</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-blue-100 rounded text-blue-700 font-semibold">呼吸</code>、<code className="bg-white px-1.5 py-0.5 border border-blue-100 rounded text-blue-700 font-semibold">手抖</code>、<code className="bg-white px-1.5 py-0.5 border border-blue-100 rounded text-blue-700 font-semibold">紧张</code>、<code className="bg-white px-1.5 py-0.5 border border-blue-100 rounded text-blue-700 font-semibold">失眠</code>。
                </p>
              </div>

              {/* 工具2：GAD-7 */}
              <div 
                className="p-3 bg-amber-50/40 hover:bg-amber-100/60 rounded-xl border border-amber-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('gad7')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-700">📋 工具 2：GAD-7 焦虑评估 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-amber-500 bg-amber-100/60 px-1.5 py-0.2 rounded font-semibold">标准化筛查</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-amber-100 rounded text-amber-700 font-semibold">焦虑</code>、<code className="bg-white px-1.5 py-0.5 border border-amber-100 rounded text-amber-700 font-semibold">担心</code>、<code className="bg-white px-1.5 py-0.5 border border-amber-100 rounded text-amber-700 font-semibold">不安</code>。7题标准化量表，0-21分×4等级，非医学诊断。
                </p>
              </div>

              {/* 工具3：ACT */}
              <div 
                className="p-3 bg-teal-50/40 hover:bg-teal-100/60 rounded-xl border border-teal-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('act')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-teal-700">💎 工具 3：ACT 价值澄清 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-teal-500 bg-teal-100/60 px-1.5 py-0.2 rounded font-semibold">接纳承诺</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-teal-100 rounded text-teal-700 font-semibold">内耗</code>、<code className="bg-white px-1.5 py-0.5 border border-teal-100 rounded text-teal-700 font-semibold">迷茫</code>、<code className="bg-white px-1.5 py-0.5 border border-teal-100 rounded text-teal-700 font-semibold">自责</code>。
                </p>
              </div>

              {/* 工具4：CBT */}
              <div 
                className="p-3 bg-violet-50/40 hover:bg-violet-100/60 rounded-xl border border-violet-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('cbt')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-violet-700">🧠 工具 4：CBT 认知重构表 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-violet-500 bg-violet-100/60 px-1.5 py-0.2 rounded font-semibold">想法检验</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-violet-100 rounded text-violet-700 font-semibold">想太多</code>、<code className="bg-white px-1.5 py-0.5 border border-violet-100 rounded text-violet-700 font-semibold">我不行</code>、<code className="bg-white px-1.5 py-0.5 border border-violet-100 rounded text-violet-700 font-semibold">都是我的错</code>、<code className="bg-white px-1.5 py-0.5 border border-violet-100 rounded text-violet-700 font-semibold">万一</code>。识别认知偏差→收集证据→建立平衡想法。
                </p>
              </div>

              {/* 工具5：SFBT */}
              <div 
                className="p-3 bg-sky-50/40 hover:bg-sky-100/60 rounded-xl border border-sky-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('sfbt')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-sky-700">🌟 工具 5：SFBT 例外搜寻 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-sky-500 bg-sky-100/60 px-1.5 py-0.2 rounded font-semibold">资源建构</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-sky-100 rounded text-sky-700 font-semibold">总是失败</code>、<code className="bg-white px-1.5 py-0.5 border border-sky-100 rounded text-sky-700 font-semibold">拖延</code>、<code className="bg-white px-1.5 py-0.5 border border-sky-100 rounded text-sky-700 font-semibold">没希望</code>。
                </p>
              </div>

              {/* 工具6：情绪日记 */}
              <div 
                className="p-3 bg-rose-50/40 hover:bg-rose-100/60 rounded-xl border border-rose-100/50 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => handleToolClick('diary')}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-rose-700">📝 工具 6：情绪日记 <span className="text-[9px] opacity-60 ml-1">✨</span></span>
                  <span className="text-[10px] text-rose-500 bg-rose-100/60 px-1.5 py-0.2 rounded font-semibold">日常记录</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  关键字：<code className="bg-white px-1.5 py-0.5 border border-rose-100 rounded text-rose-700 font-semibold">写日记</code>、<code className="bg-white px-1.5 py-0.5 border border-rose-100 rounded text-rose-700 font-semibold">记录心情</code>、<code className="bg-white px-1.5 py-0.5 border border-rose-100 rounded text-rose-700 font-semibold">总结一天</code>。记录情绪标签、强度、触发事件、身体感受和应对方式。
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-200/60" />

          {/* 评估工具 */}
          <div className="p-3 bg-green-50/40 border border-green-100/50 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-green-700 flex items-center">
              <ClipboardList className="w-3.5 h-3.5 text-green-600 mr-1.5" />
              标准化评估量具
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              内置<strong>GAD-7</strong>（广泛性焦虑障碍量表），7题×4级评分，总分0-21分。结果仅供自我筛查参考，不能替代专业医学诊断。后续可扩展PHQ-9、PSS-10等更多量表。
            </p>
          </div>

          {/* 安全红线规范 */}
          <div className="p-3 bg-amber-50/40 border border-amber-100/50 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-amber-700 flex items-center">
              <Shield className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
              伦理红线与危机预拦截
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              智能体严格限制提供诊断。若发送<code className="text-rose-600 bg-rose-50 font-bold px-1 rounded mx-0.5">不想活了</code>等危机词汇，系统将本地瞬间拦截，不发送API请求，启动危机防护卡片并引导危机干预热线。
            </p>
          </div>
        </div>

        {/* 底部信息与深色模式切换 */}
        <div className="mt-6 pt-4 border-t border-slate-200/50 text-[11px] text-slate-400 space-y-3">
          <div className="flex items-center space-x-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>数据与密钥均 100% 留存在本地浏览器</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Powered by DeepSeek API | CBT · ACT · SFBT · GAD-7</span>
          </div>
          
          {/* 深色模式切换按钮 */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors text-xs font-medium"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>切换到浅色模式</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>切换到深色模式</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 右侧主聊天区 */}
      <div className="flex-1 h-full p-4 md:p-6 flex flex-col relative overflow-hidden">
        <ChatWindow 
          onApiKeyChange={() => setShowKeyConfig(true)} 
          triggerTool={triggerTool}
          onToolTriggered={() => setTriggerTool(null)}
        />

        {/* DeepSeek API Key 弹窗配置 */}
        {showKeyConfig && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
              <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center space-x-3">
                <Key className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="font-bold text-base">DeepSeek API 配置</h3>
                  <p className="text-xs opacity-90">请设置您的 DeepSeek 平台调用密钥</p>
                </div>
              </div>

              <form onSubmit={handleSaveKey} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">DeepSeek API Key：</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                    * 如果您当前没有有效的 Key，可以直接留空并关闭窗口。系统会**自动启动本地疗愈模拟服务**，依然能够完整体验所有对话与交互式功能！
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">接口请求端点 (API Base URL)：</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.deepseek.com/v1"
                    className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-between items-center space-x-3">
                  {apiService.getApiKey() && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition-colors"
                    >
                      清空我的密钥
                    </button>
                  )}
                  <div className="flex-1 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowKeyConfig(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors"
                    >
                      离线试用
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10"
                    >
                      保存并应用
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
