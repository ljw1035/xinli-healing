import React, { useState, useEffect, useRef } from 'react';
import { Message, ToolCall } from '../types/chat';
import { apiService } from '../services/apiService';
import { ToolWidgets } from './ToolWidgets';
import { Heart, Send, Sparkles, RefreshCw, Key, ShieldAlert, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';

interface ChatWindowProps {
  onApiKeyChange: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onApiKeyChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  // 量化评估：前后评分追踪
  const [sessionScores, setSessionScores] = useState<{ before: number | null; after: number | null; trend: 'up' | 'down' | 'same' | null }>({
    before: null, after: null, trend: null
  });
  const [showSummary, setShowSummary] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a welcoming message
  useEffect(() => {
    const defaultMessages: Message[] = [
      {
        id: 'msg-welcome',
        role: 'system',
        content: '你是一个非常专业、温暖且具备深厚共情能力的心理疗愈智能体——心声疗愈。'
      },
      {
        id: 'msg-hello',
        role: 'assistant',
        content: `你好，我是你的专属心理疗愈智能体 💖。

无论你今天经历了什么、现在正被怎样的情绪所困扰，都请深吸一口气。在这里，没有评判，没有压力，只有全然地接纳和耐心的倾听。

我可以随时陪伴你：
🌡️ **心情温度计** — 给当前情绪做一个量化评分
🧘 **呼吸放松训练** — 缓解紧张、心慌、失眠
📋 **GAD-7 焦虑评估** — 客观了解近两周焦虑水平
💎 **ACT 价值澄清** — 梳理焦虑背后的真正在意
🧠 **CBT 认知重构** — 识别并挑战消极思维模式
🌟 **SFBT 小目标** — 寻找例外资源，制定可行计划
📝 **情绪日记** — 记录和整理每天的心情

如果你准备好了，我们可以随便聊聊，或者直接告诉我你当下的烦恼。我建议我们可以先做一个心情温度计评分，这样能更好地追踪后续的变化。` 
      }
    ];
    setMessages(defaultMessages);
    setSessionScores({ before: null, after: null, trend: null });
    setShowSummary(false);
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 追踪评分变化 —— 从 self_rating_mood tool 消息中提取
  useEffect(() => {
    const ratingMsgs = messages.filter(m => m.name === 'self_rating_mood' && m.role === 'tool');
    if (ratingMsgs.length >= 1 && sessionScores.before === null) {
      try {
        const data = JSON.parse(ratingMsgs[0].content);
        if (typeof data.score === 'number') {
          setSessionScores(prev => ({ ...prev, before: data.score }));
        }
      } catch {}
    }
    if (ratingMsgs.length >= 2 && sessionScores.after === null) {
      try {
        const data = JSON.parse(ratingMsgs[ratingMsgs.length - 1].content);
        if (typeof data.score === 'number') {
          const before = sessionScores.before;
          setSessionScores(prev => ({
            ...prev,
            after: data.score,
            trend: before !== null ? (data.score > before ? 'up' : data.score < before ? 'down' : 'same') : null
          }));
          if (before !== null) {
            setShowSummary(true);
          }
        }
      } catch {}
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setSystemAlert(null);

    // Create unique user message
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: userText
    };

    // Check for crisis risk (Self-harm/Suicide)
    if (apiService.checkCrisisRisk(userText)) {
      // Immediate emergency local response (NO API CALL to guarantee 100% safety and immediate response)
      setMessages(prev => [...prev, userMessage]);
      
      setTimeout(() => {
        const crisisMsg: Message = {
          id: `msg-crisis-${Date.now()}`,
          role: 'assistant',
          isCrisis: true,
          content: `听到你刚才说的话，我感到无比的心疼，也深知你现在正承受着难以言喻的痛苦。请允许我温柔地拉住你。💖
          
虽然我只是一个AI智能体，但我非常在乎你的生命安全。请相信，这个世界上仍有无数双温暖的手愿意拥抱你、倾听你、帮助你。痛苦是暂时的，我们现在可以先停下来，试着通过物理世界获得专业的帮助。`
        };
        setMessages(prev => [...prev, crisisMsg]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // Normal path
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await apiService.sendChatMessage(updatedMessages);
      setMessages(prev => [...prev, response.message]);
    } catch (err: any) {
      console.error(err);
      setSystemAlert('发生网络波动，已为您切换到本地安全心理疗愈机制。');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle the completion of a tool's client-side interaction
   */
  const handleToolExecutionComplete = async (toolMessageId: string, toolName: string, callId: string, feedbackText: string, data: any) => {
    // 1. Mark the message containing the tool_call as executed
    setMessages(prev => prev.map(msg => {
      if (msg.id === toolMessageId) {
        return { ...msg, toolExecuted: true, toolResultData: data };
      }
      return msg;
    }));

    setIsLoading(true);

    // 2. Create the tool role message
    const toolMsg: Message = {
      id: `tool-${Date.now()}`,
      role: 'tool',
      name: toolName,
      tool_call_id: callId,
      content: JSON.stringify(data)
    };

    // 3. User feedback message (displayed to keep conversational flow natural)
    const userFeedbackMsg: Message = {
      id: `msg-feedback-${Date.now()}`,
      role: 'user',
      content: feedbackText
    };

    const newMessagesList = [...messages, userFeedbackMsg, toolMsg];
    setMessages(newMessagesList);

    try {
      // 4. Send tool results back to LLM to get an encouraging feedback response
      const response = await apiService.sendChatMessage(newMessagesList);
      setMessages(prev => [...prev, response.message]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('确定要清空当前的疗愈对话记录吗？')) {
      const resetMessages: Message[] = [
        messages[0], // Keep system instruction
        {
          id: `msg-welcome-new-${Date.now()}`,
          role: 'assistant',
          content: '新的一轮倾听已经开始。深深地吸气、静静地吐气。把昨天的烦恼留给昨天，此刻，请告诉我你的心里话。💖'
        }
      ];
      setMessages(resetMessages);
      setSessionScores({ before: null, after: null, trend: null });
      setShowSummary(false);
      setSystemAlert(null);
    }
  };

  // 渲染简单 Markdown 行
  const renderMarkdownLine = (line: string, isUser: boolean) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = line.split(boldRegex);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className={isUser ? 'text-white' : 'text-slate-900 font-bold'}>{part}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
      {/* 顶部控制面板 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 animate-pulse">
            <Heart className="w-5 h-5 fill-current text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex items-center">
              心理疗愈智能体
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full">
                {apiService.getApiKey() ? 'DeepSeek API 联网状态' : '本地离线疗愈模式'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">基于 CBT / ACT / SFBT / GAD-7 循证疗法</p>
          </div>
        </div>

        {/* 量化评分小结 */}
        {sessionScores.before !== null && (
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/80 rounded-xl border border-slate-100 text-xs">
            <TrendingUp className="w-3 h-3 text-indigo-500" />
            <span className="text-slate-400">心情</span>
            <span className="font-bold text-indigo-600">{sessionScores.before}</span>
            {sessionScores.after !== null ? (
              <>
                <span className="text-slate-400">→</span>
                <span className={`font-bold ${sessionScores.trend === 'up' ? 'text-emerald-600' : sessionScores.trend === 'down' ? 'text-rose-600' : 'text-slate-600'}`}>
                  {sessionScores.after}
                </span>
                {sessionScores.trend === 'up' && <span className="text-emerald-500">↑</span>}
                {sessionScores.trend === 'down' && <span className="text-rose-500">↓</span>}
              </>
            ) : (
              <span className="text-[10px] text-slate-400">/10</span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={onApiKeyChange}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-blue-600 transition-all text-xs flex items-center space-x-1 border border-slate-100 bg-white"
            title="设置 API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API 设置</span>
          </button>
          <button
            onClick={clearChatHistory}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
            title="清空对话"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 系统级提示 */}
      {systemAlert && (
        <div className="bg-amber-50 text-amber-800 px-4 py-2 text-xs border-b border-amber-100 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{systemAlert}</span>
        </div>
      )}

      {/* 量化评估小结横幅 */}
      {showSummary && sessionScores.before !== null && sessionScores.after !== null && (
        <div className={`px-4 py-3 border-b text-sm flex items-center justify-between ${sessionScores.trend === 'up' ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100' : sessionScores.trend === 'down' ? 'bg-amber-50/50 text-amber-800 border-amber-100' : 'bg-blue-50/50 text-blue-800 border-blue-100'}`}>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">
              {sessionScores.trend === 'up' ? '🎉 情绪改善效果显著！' : sessionScores.trend === 'down' ? '💪 暂时波动是正常的，我们继续努力' : '📊 情绪状态保持平稳'}
            </span>
            <span className="text-xs opacity-75">
              心情从 {sessionScores.before} 分 → {sessionScores.after} 分
              {sessionScores.trend === 'up' && `（+${sessionScores.after - sessionScores.before}）`}
            </span>
          </div>
          <button onClick={() => setShowSummary(false)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* 对话窗口主内容区 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-100">
        {messages
          .filter(msg => msg.role !== 'system' && msg.role !== 'tool')
          .map((msg) => {
            const isUser = msg.role === 'user';
            
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`flex space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* 头像 */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center shadow-sm text-xs font-bold ${isUser ? 'bg-gradient-to-tr from-blue-500 to-sky-400 text-white' : 'bg-gradient-to-tr from-indigo-100 to-purple-50 text-indigo-700 border border-indigo-100'}`}>
                    {isUser ? '我' : '疗'}
                  </div>

                  {/* 消息气泡 */}
                  <div className="space-y-3">
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      {msg.content.split('\n').map((line, idx) => (
                        <div key={idx} className={line === '' ? 'h-3' : 'mb-1 last:mb-0'}>
                          {renderMarkdownLine(line, isUser)}
                        </div>
                      ))}
                    </div>

                    {/* 如果属于自残/自杀安全风险，进行最强烈的危机预警阻断与帮助 */}
                    {msg.isCrisis && (
                      <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-2xl shadow-sm text-slate-800 space-y-4 animate-bounce-short">
                        <div className="flex items-center space-x-2 text-rose-700 font-bold">
                          <ShieldAlert className="w-5 h-5 text-rose-600" />
                          <span className="text-base">🚨 危机心理干预与援助系统</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          生命极其宝贵，每个人都有权利在黑暗中抓住一缕微光。请**立刻**拨打以下电话，那头是全天候守护您的专业心理医生：
                        </p>
                        
                        <div className="space-y-2.5">
                          <div className="bg-white p-3 rounded-xl border border-rose-100 flex justify-between items-center">
                            <div>
                              <span className="text-xs text-slate-400 font-semibold block">北京回龙观医院危机干预热线</span>
                              <span className="text-sm font-bold text-rose-600">800-810-1117</span>
                            </div>
                            <a href="tel:8008101117" className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-colors">呼叫</a>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-rose-100 flex justify-between items-center">
                            <div>
                              <span className="text-xs text-slate-400 font-semibold block">希望24小时热线 (自杀干预)</span>
                              <span className="text-sm font-bold text-rose-600">400-161-9995</span>
                            </div>
                            <a href="tel:4001619995" className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-colors">呼叫</a>
                          </div>
                        </div>

                        <div className="bg-rose-100/40 p-3 rounded-xl text-xs text-slate-600">
                          📌 此外，您也可以随时拨打紧急物理救助电话：**110 (报警)**、**120 (急救)** 或向身边的亲友寻求帮助。
                        </div>
                      </div>
                    )}

                    {/* 工具调用界面嵌入渲染 */}
                    {msg.tool_calls?.map((toolCall) => {
                      let toolArgs = {};
                      try {
                        toolArgs = JSON.parse(toolCall.function.arguments);
                      } catch (e) {
                        console.error('Error parsing tool call args', e);
                      }

                      return (
                        <div key={toolCall.id} className="w-full">
                          <ToolWidgets
                            toolName={toolCall.function.name}
                            args={toolArgs}
                            isExecuted={!!msg.toolExecuted}
                            resultData={msg.toolResultData}
                            onExecute={(feedback, data) => 
                              handleToolExecutionComplete(
                                msg.id, 
                                toolCall.function.name, 
                                toolCall.id, 
                                feedback, 
                                data
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

        {/* 正在思考/打字状态 */}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs animate-spin">
                <Sparkles className="w-4 h-4 text-indigo-500 fill-current" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center space-x-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs ml-1 font-medium tracking-wide">正在聆听并思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入框 */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center space-x-2 bg-white rounded-2xl border border-slate-200 p-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={apiService.getApiKey() ? "在这里倾诉你想说的话..." : "倾诉并发送（将使用本地安全模式回复）..."}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-xl transition-all shadow-sm flex items-center justify-center ${inputValue.trim() && !isLoading ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white hover:shadow-md' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-2 tracking-wide">
          声明：本系统作为辅助支持，不能代替专业的医学诊断、精神科药物处方或专业线下心理治疗。
        </p>
      </div>
    </div>
  );
};
