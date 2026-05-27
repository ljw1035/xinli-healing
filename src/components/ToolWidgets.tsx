import React, { useState, useEffect } from 'react';
import { BreathingToolArgs, ActToolArgs, SfbtToolArgs } from '../types/chat';

interface ToolWidgetProps {
  toolName: string;
  args: any;
  onExecute: (resultText: string, data: any) => void;
  isExecuted: boolean;
  resultData?: any;
}

export const ToolWidgets: React.FC<ToolWidgetProps> = ({
  toolName,
  args: rawArgs,
  onExecute,
  isExecuted,
  resultData
}) => {
  // 防御性设计：确保 args 绝不为 null / undefined
  const args = rawArgs || {};

  switch (toolName) {
    case 'self_rating_mood':
      return <SelfRatingWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'breathing_relaxation':
      return <BreathingRelaxationWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'gad7_assessment':
      return <Gad7AssessmentWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'act_values_clarification':
      return <ActClarificationWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'cbt_cognitive_restructuring':
      return <CbtCognitiveRestructuringWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'sfbt_exception_goals':
      return <SfbtGoalWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    case 'emotion_diary':
      return <EmotionDiaryWidget args={args} onExecute={onExecute} isExecuted={isExecuted} resultData={resultData} />;
    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 italic border border-slate-100">
          正在执行未知工具: {toolName}
        </div>
      );
  }
};

/**
 * 0. 情绪自评温度计组件
 */
const SelfRatingWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const prompt = args?.prompt || '请给你的当前情绪状态打分（1-10分）';
  const minLabel = args?.min_label || '极度低落';
  const maxLabel = args?.max_label || '非常愉悦';
  const estimated = typeof args?.current_estimated === 'number' ? args.current_estimated : 5;
  
  const [score, setScore] = useState(estimated);

  const getEmoji = (s: number) => {
    if (s <= 2) return '😢';
    if (s <= 4) return '😟';
    if (s <= 6) return '😐';
    if (s <= 8) return '🙂';
    return '😄';
  };

  const getColor = (s: number) => {
    if (s <= 3) return 'bg-rose-500';
    if (s <= 5) return 'bg-amber-500';
    if (s <= 7) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  const handleSubmit = () => {
    const feedback = `我给我的当前情绪状态打了 ${score} 分。`;
    onExecute(feedback, { score, label: minLabel + ' → ' + maxLabel, timestamp: Date.now() });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold">🌡️</span>
        <h4 className="font-semibold text-slate-900 text-base">心情温度计</h4>
      </div>

      <p className="text-sm text-slate-600 mb-4">{prompt}</p>

      <div className="bg-white/80 rounded-xl p-5 mb-4 border border-purple-100/50">
        <div className="text-center mb-4">
          <span className="text-5xl">{getEmoji(score)}</span>
          <div className="text-3xl font-bold text-purple-700 mt-2">{score} 分</div>
        </div>

        {!isExecuted ? (
          <>
            <input
              type="range"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1分 · {minLabel}</span>
              <span>5分 · 一般</span>
              <span>10分 · {maxLabel}</span>
            </div>
          </>
        ) : (
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getColor(resultData?.score || score)}`} style={{ width: `${(resultData?.score || score) * 10}%` }} />
          </div>
        )}
      </div>

      {!isExecuted ? (
        <button onClick={handleSubmit} className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
          确认我的心情分数
        </button>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-purple-600 font-medium rounded-xl text-sm border border-purple-200 cursor-not-allowed">
          ✓ 心情温度计已完成
        </button>
      )}
    </div>
  );
};

/**
 * GAD-7 焦虑自评量表组件 (新增)
 */
const GAD7_QUESTIONS = [
  '感到紧张、焦虑或烦躁',
  '无法停止或控制担忧',
  '对各种各样的事情担忧过多',
  '难以放松',
  '焦躁不安，难以静坐',
  '变得容易烦恼或急躁',
  '感到害怕，好像可怕的事情会发生',
];

const GAD7_OPTIONS = [
  { score: 0, label: '完全没有' },
  { score: 1, label: '有几天' },
  { score: 2, label: '一半以上天数' },
  { score: 3, label: '几乎每天' },
];

const Gad7AssessmentWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const introduction = args?.introduction || '这是一份简单的7题问卷，帮助你了解近两周的焦虑水平。';
  const instruction = args?.instruction || '请回想过去两周内，以下问题困扰你的频率。';
  
  const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1));
  const totalScore = answers.reduce((sum, s) => s >= 0 ? sum + s : sum, 0);
  const allAnswered = answers.every(a => a >= 0);

  const getLevel = (score: number) => {
    if (score <= 4) return { level: '正常范围', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score <= 9) return { level: '轻度焦虑', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (score <= 14) return { level: '中度焦虑', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { level: '中重度焦虑', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
  };

  const handleSubmit = () => {
    const levelInfo = getLevel(totalScore);
    const feedback = `我完成了 GAD-7 焦虑自评量表，总分 ${totalScore}/21 分，参考等级：【${levelInfo.level}】。`;
    onExecute(feedback, { total_score: totalScore, level: levelInfo.level, answers, scale: 'GAD-7' });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold">📋</span>
        <h4 className="font-semibold text-slate-900 text-base">GAD-7 焦虑自评量表</h4>
        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">筛查参考</span>
      </div>

      <div className="p-3 bg-amber-100/50 rounded-xl text-xs text-amber-800 mb-4 border border-amber-200/50">
        ⚠️ {introduction}
      </div>

      <div className="space-y-4 mb-4">
        <p className="text-xs text-slate-400 font-medium">{instruction}</p>
        {/* 表头 */}
        <div className="hidden sm:grid grid-cols-[1fr_repeat(4,80px)] gap-2 text-[10px] text-slate-400 font-semibold px-2">
          <span>题目</span>
          {GAD7_OPTIONS.map(o => <span key={o.score} className="text-center">{o.label}</span>)}
        </div>
        {GAD7_QUESTIONS.map((question, qi) => (
          <div key={qi} className="bg-white/80 rounded-xl p-3 border border-amber-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 sm:w-[45%] shrink-0">
                {qi + 1}. {question}
              </span>
              <div className="flex gap-1.5 sm:gap-2 flex-1">
                {GAD7_OPTIONS.map((opt) => (
                  <button
                    key={opt.score}
                    disabled={isExecuted}
                    onClick={() => {
                      const newAns = [...answers];
                      newAns[qi] = opt.score;
                      setAnswers(newAns);
                    }}
                    className={`flex-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all border ${
                      isExecuted
                        ? resultData?.answers?.[qi] === opt.score
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : answers[qi] === opt.score
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 得分显示 */}
      {allAnswered && (
        <div className={`p-4 rounded-xl border mb-4 ${getLevel(totalScore).bg} ${getLevel(totalScore).border}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">总分：{totalScore} / 21</span>
            <span className={`text-sm font-bold ${getLevel(totalScore).color}`}>{getLevel(totalScore).level}</span>
          </div>
          <div className="w-full h-2 bg-white/50 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                totalScore <= 4 ? 'bg-emerald-400' : totalScore <= 9 ? 'bg-amber-400' : totalScore <= 14 ? 'bg-orange-400' : 'bg-rose-400'
              }`}
              style={{ width: `${Math.min(totalScore / 21 * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">此结果仅为自我筛查参考，不能替代专业医学诊断</p>
        </div>
      )}

      {!isExecuted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm ${
            allAnswered ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {allAnswered ? `✓ 完成评估（总分 ${totalScore}）` : '请完成所有 7 题后再提交'}
        </button>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-amber-600 font-medium rounded-xl text-sm border border-amber-200 cursor-not-allowed">
          ✓ GAD-7 评估已完成（总分 {resultData?.total_score}/21 · {resultData?.level}）
        </button>
      )}
    </div>
  );
};

/**
 * CBT 认知重构表组件 (新增)
 */
const CbtCognitiveRestructuringWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const situation = args?.situation || '请描述触发情绪的具体情境';
  const automaticThought = args?.automatic_thought || '请写下自动产生的消极想法';
  const emotionIntensity = args?.emotion_and_intensity || '情绪及强度（如焦虑 7/10）';
  const cognitiveDistortion = args?.cognitive_distortion || '涉及的认知偏差类型';
  
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');
  const [changedIntensity, setChangedIntensity] = useState(5);

  const cognitiveDistortionsList = [
    { key: '读心术', desc: '假设你知道别人在想什么' },
    { key: '灾难化', desc: '过度预测最坏结果' },
    { key: '以偏概全', desc: '从一个事件推及全部' },
    { key: '非黑即白', desc: '要么全好要么全坏' },
    { key: '个人化', desc: '把所有责任归咎于自己' },
    { key: '情绪推理', desc: '以感受代替事实' },
    { key: '应该思维', desc: '用"必须""应该"苛求自己' },
  ];

  const handleSubmit = () => {
    const feedback = `我完成了 CBT 认知重构。针对情境【${situation}】，原来自动想法为"${automaticThought}"，经过证据分析和偏差识别后，我建立了更平衡的想法："${balancedThought || '我正在学习形成新的思维模式'}"。`;
    onExecute(feedback, {
      situation,
      automatic_thought: automaticThought,
      emotion_intensity: emotionIntensity,
      cognitive_distortion: cognitiveDistortion,
      evidence_for: evidenceFor,
      evidence_against: evidenceAgainst,
      balanced_thought: balancedThought,
      changed_intensity: changedIntensity
    });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-violet-500 text-white rounded-lg text-xs font-bold">🧠</span>
        <h4 className="font-semibold text-slate-900 text-base">CBT 认知重构表</h4>
        <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-semibold">想法检验</span>
      </div>

      <div className="space-y-4 mb-4">
        {/* 情境 & 自动想法 (AI填充) */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-violet-100/50 space-y-3">
          <div>
            <span className="text-[10px] text-violet-500 font-semibold tracking-wider block mb-1">🔍 客观情境：</span>
            <p className="text-sm text-slate-700">{situation}</p>
          </div>
          <div>
            <span className="text-[10px] text-rose-500 font-semibold tracking-wider block mb-1">⚡ 自动消极想法：</span>
            <p className="text-sm text-slate-700 font-medium">{automaticThought}</p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="text-slate-400">情绪与强度：<span className="text-slate-700">{emotionIntensity}</span></span>
            <span className="text-slate-400">认知偏差：<span className="text-violet-600 font-semibold">{cognitiveDistortion}</span></span>
          </div>
          {/* 认知偏差参考 */}
          <div className="flex flex-wrap gap-1 pt-1">
            {cognitiveDistortionsList.map(cd => (
              <span key={cd.key} className="text-[10px] bg-violet-100/50 text-violet-600 px-1.5 py-0.5 rounded" title={cd.desc}>
                {cd.key}
              </span>
            ))}
          </div>
        </div>

        {/* 证据收集 (用户填写) */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-violet-100/50">
          <span className="text-[10px] text-slate-500 font-semibold block mb-1">📝 支持这个想法的客观证据：</span>
          {isExecuted ? (
            <p className="text-sm text-slate-700">{resultData?.evidence_for || evidenceFor || '（未填写）'}</p>
          ) : (
            <textarea value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-violet-400 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={2}
              placeholder={'有什么具体事实支持这个想法？注意区分"感觉"和"事实"…'} />
          )}
        </div>

        <div className="bg-white/80 rounded-xl p-3.5 border border-emerald-100/50">
          <span className="text-[10px] text-emerald-600 font-semibold block mb-1">✅ 反对这个想法的客观证据：</span>
          {isExecuted ? (
            <p className="text-sm text-slate-700">{resultData?.evidence_against || evidenceAgainst || '（未填写）'}</p>
          ) : (
            <textarea value={evidenceAgainst} onChange={(e) => setEvidenceAgainst(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-emerald-400 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={2}
              placeholder="有什么事实与这个想法矛盾？如果朋友有同样想法你会怎么劝他？" />
          )}
        </div>

        {/* 平衡想法 (用户填写) */}
        <div className="bg-gradient-to-r from-violet-100/50 to-purple-100/50 rounded-xl p-3.5 border border-violet-200/50">
          <span className="text-[10px] text-violet-700 font-semibold block mb-1">✨ 更平衡、更现实的替代想法：</span>
          {isExecuted ? (
            <p className="text-sm text-slate-800 font-medium">{resultData?.balanced_thought || balancedThought || '（未填写）'}</p>
          ) : (
            <textarea value={balancedThought} onChange={(e) => setBalancedThought(e.target.value)}
              className="w-full text-sm bg-white/80 border border-violet-200 focus:border-violet-500 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={2}
              placeholder="综合考虑所有证据后，一个更客观、温和的想法是…" />
          )}
        </div>

        {/* 重新打分 */}
        {!isExecuted && (
          <div className="bg-white/80 rounded-xl p-3.5 border border-slate-100">
            <span className="text-[10px] text-slate-500 font-semibold block mb-2">📊 现在，这种情绪的强度还有几分？（1-10）</span>
            <input type="range" min="1" max="10" value={changedIntensity}
              onChange={(e) => setChangedIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg accent-violet-500" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1分 · 几乎没了</span>
              <span>{changedIntensity}分</span>
              <span>10分 · 依然强烈</span>
            </div>
          </div>
        )}
      </div>

      {!isExecuted ? (
        <button onClick={handleSubmit}
          className="w-full py-2.5 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
          ✨ 保存认知重构结果
        </button>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-violet-600 font-medium rounded-xl text-sm border border-violet-200 cursor-not-allowed">
          ✓ CBT 认知重构已完成
        </button>
      )}
    </div>
  );
};

/**
 * 情绪日记组件 (新增)
 */
const EmotionDiaryWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const prompt = args?.prompt || '和我一起记录此刻的心情吧';
  const suggestedEmotions: string[] = Array.isArray(args?.suggested_emotions) ? args.suggested_emotions : ['平静', '焦虑', '疲惫', '希望'];

  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [bodyFeeling, setBodyFeeling] = useState('');
  const [coping, setCoping] = useState('');

  const allAvailableEmotions = ['😊 平静', '😰 焦虑', '😢 悲伤', '😤 愤怒', '😴 疲惫', '🌟 希望', '😔 孤独', '🥰 满足', '🤔 迷茫', '😨 恐惧', '🥺 委屈', '😌 欣慰'];

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const handleSubmit = () => {
    const emotions = selectedEmotions.map(e => e.replace(/^[^\s]+\s/, ''));
    const feedback = `我完成了今日的情绪日记。主要情绪：${emotions.join('、') || '混合情绪'}，强度约 ${intensity}/10 分。`;
    onExecute(feedback, {
      emotions,
      intensity,
      trigger,
      body_feeling: bodyFeeling,
      coping,
      timestamp: Date.now()
    });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold">📝</span>
        <h4 className="font-semibold text-slate-900 text-base">情绪日记</h4>
        <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">每日自察</span>
      </div>

      <p className="text-sm text-slate-600 mb-4">{prompt}</p>

      <div className="space-y-4 mb-4">
        {/* 情绪标签选择 */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-100/50">
          <span className="text-[10px] text-rose-500 font-semibold block mb-2">🎭 今天主要有哪些情绪？（可多选）</span>
          <div className="flex flex-wrap gap-1.5">
            {allAvailableEmotions.map(emotion => {
              const isSelected = isExecuted
                ? (resultData?.emotions || []).some((e: string) => emotion.includes(e))
                : selectedEmotions.includes(emotion);
              return (
                <button key={emotion}
                  disabled={isExecuted}
                  onClick={() => toggleEmotion(emotion)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all border ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300'
                  } ${isExecuted ? 'cursor-not-allowed' : ''}`}
                >
                  {emotion}
                </button>
              );
            })}
          </div>
        </div>

        {/* 情绪强度 */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-100/50">
          <span className="text-[10px] text-slate-500 font-semibold block mb-2">⚡ 情绪整体强度：<span className="text-rose-600 font-bold">{isExecuted ? resultData?.intensity : intensity} / 10</span></span>
          {!isExecuted ? (
            <input type="range" min="1" max="10" value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg accent-rose-500" />
          ) : (
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full" style={{ width: `${(resultData?.intensity || intensity) * 10}%` }} />
            </div>
          )}
        </div>

        {/* 触发事件 */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-100/50">
          <span className="text-[10px] text-slate-500 font-semibold block mb-1">📍 今天是什么触发了这些情绪？</span>
          {isExecuted ? (
            <p className="text-sm text-slate-700">{resultData?.trigger || '（未填写）'}</p>
          ) : (
            <textarea value={trigger} onChange={(e) => setTrigger(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={2}
              placeholder="比如：考试结果出来、和朋友发生了争执、什么都没发生但突然很丧…" />
          )}
        </div>

        {/* 身体感受 */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-100/50">
          <span className="text-[10px] text-slate-500 font-semibold block mb-1">🫀 身体有什么感觉？</span>
          {isExecuted ? (
            <p className="text-sm text-slate-700">{resultData?.body_feeling || '（未填写）'}</p>
          ) : (
            <textarea value={bodyFeeling} onChange={(e) => setBodyFeeling(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={1}
              placeholder="如：胸口闷、肩膀紧绷、头痛、手脚冰凉…" />
          )}
        </div>

        {/* 应对方式 */}
        <div className="bg-white/80 rounded-xl p-3.5 border border-rose-100/50">
          <span className="text-[10px] text-slate-500 font-semibold block mb-1">🛡️ 今天我用了什么方式来应对或照顾自己？</span>
          {isExecuted ? (
            <p className="text-sm text-slate-700">{resultData?.coping || '（未填写）'}</p>
          ) : (
            <textarea value={coping} onChange={(e) => setCoping(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 focus:border-rose-400 rounded-lg p-2.5 resize-none focus:outline-none transition-all" rows={1}
              placeholder="如：听了音乐、出去散步、和朋友聊天、深呼吸…" />
          )}
        </div>
      </div>

      {!isExecuted ? (
        <button onClick={handleSubmit}
          className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
          💌 保存今日情绪日记
        </button>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-rose-600 font-medium rounded-xl text-sm border border-rose-200 cursor-not-allowed">
          ✓ 情绪日记已记录（{new Date(resultData?.timestamp).toLocaleDateString?.() || '今日'}）
        </button>
      )}
    </div>
  );
};

/**
 * 1. 呼吸与放松训练组件 (工具 2)
 */
const BreathingRelaxationWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  // 安全的参数及字段兜底
  const method = args?.method || '呼吸放松训练';
  const duration = args?.duration || '3分钟';
  const expectedEffect = args?.expected_effect || '降低生理唤醒水平，恢复心理安定。';
  
  // 核心防御：防止 args.steps 不是 Array 时导致的 .map 崩溃
  const rawSteps = args?.steps;
  const steps = Array.isArray(rawSteps)
    ? rawSteps
    : typeof rawSteps === 'string'
      ? rawSteps.split(/[;\n，；。]+/).map(s => s.trim()).filter(Boolean)
      : ['慢慢吸气 4 秒 🌟', '平静屏息 7 秒 🌌', '缓缓呼气 8 秒 🍃', '重复 4 轮'];

  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const totalRounds = 4;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
      } else {
        // 呼吸阶段转换 (4-7-8 或者是通用转换)
        if (phase === 'idle') {
          setPhase('inhale');
          setTimeLeft(4);
        } else if (phase === 'inhale') {
          setPhase('hold');
          setTimeLeft(7);
        } else if (phase === 'hold') {
          setPhase('exhale');
          setTimeLeft(8);
        } else if (phase === 'exhale') {
          if (round < totalRounds) {
            setRound(prev => prev + 1);
            setPhase('inhale');
            setTimeLeft(4);
          } else {
            // 完成训练
            setIsPlaying(false);
            setPhase('idle');
            handleComplete();
          }
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, timeLeft, phase, round]);

  const startTraining = () => {
    setIsPlaying(true);
    setRound(1);
    setPhase('inhale');
    setTimeLeft(4);
  };

  const stopTraining = () => {
    setIsPlaying(false);
    setPhase('idle');
    setTimeLeft(0);
  };

  const handleComplete = () => {
    const feedback = `我完成了 ${method} 放松训练（共进行了 ${totalRounds} 轮）。当前感到呼吸平稳，身体的紧绷感大大减轻，情绪逐渐恢复了安定。`;
    onExecute(feedback, { method, rounds: totalRounds, status: 'completed' });
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return '慢慢吸气... 🌟';
      case 'hold': return '静静屏息... 🌌';
      case 'exhale': return '缓缓呼气... 🍃';
      default: return '准备好了吗？';
    }
  };

  const getBallScaleClass = () => {
    if (!isPlaying) return 'scale-100 opacity-90';
    switch (phase) {
      case 'inhale': return 'scale-[1.6] duration-[4000ms] ease-in-out';
      case 'hold': return 'scale-[1.6] duration-1000';
      case 'exhale': return 'scale-100 duration-[8000ms] ease-in-out';
      default: return 'scale-100';
    }
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold">工具 1</span>
        <h4 className="font-semibold text-slate-900 text-base">{method}</h4>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{duration}</span>
      </div>

      <p className="text-sm text-slate-600 mb-4">{expectedEffect}</p>

      {/* 呼吸球核心动画区域 */}
      <div className="flex flex-col items-center justify-center py-6 bg-white/60 backdrop-blur-sm rounded-xl mb-4 border border-white">
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <div className={`absolute inset-0 bg-blue-300 rounded-full blur-xl opacity-30 transition-transform ${isPlaying && phase === 'inhale' ? 'scale-150 duration-[4000ms]' : isPlaying && phase === 'exhale' ? 'scale-100 duration-[8000ms]' : 'scale-100'}`} />
          <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400 via-sky-300 to-indigo-300 flex flex-col items-center justify-center text-white font-bold transition-all shadow-md select-none ${getBallScaleClass()}`}>
            <span className="text-xs font-normal tracking-wide">
              {isPlaying ? `${timeLeft}秒` : ''}
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-indigo-900 h-7 transition-all">
            {getPhaseText()}
          </div>
          {isPlaying && (
            <div className="text-xs text-slate-500 mt-1">
              第 <span className="font-bold text-blue-600">{round}</span> / {totalRounds} 轮
            </div>
          )}
        </div>
      </div>

      {/* 引导步骤列表 */}
      <div className="text-xs text-slate-600 space-y-1 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <span className="font-semibold text-slate-700 block mb-1">训练指引：</span>
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{step}</span>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-2">
        {isExecuted ? (
          <button disabled className="w-full py-2.5 bg-slate-200 text-slate-500 font-medium rounded-xl text-sm cursor-not-allowed">
            ✓ 放松训练已完成
          </button>
        ) : isPlaying ? (
          <button onClick={stopTraining} className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 font-medium rounded-xl text-sm transition-colors">
            中止训练
          </button>
        ) : (
          <div className="flex w-full space-x-2">
            <button onClick={startTraining} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md">
              🧘 开始放松训练
            </button>
            <button onClick={handleComplete} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors">
              直接跳过并反馈
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 2. ACT 价值澄清组件 (工具 4)
 */
const ActClarificationWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const painfulFeeling = args?.painful_feeling || '焦虑与内耗';
  const underlyingValue = args?.underlying_value || '渴望个人成长与有条理掌控生活';
  const acceptanceSentence = args?.acceptance_sentence || '我可以允许这份不适暂时存在，像微风掠过湖面，我不必急于消除它。';
  const defaultCommittedAction = args?.committed_action || '今晚花十分钟闭眼休息，不做自我责备。';

  const [accepted, setAccepted] = useState(false);
  const [customAction, setCommittedAction] = useState(defaultCommittedAction);

  // 当大模型传参更新时，更新状态
  useEffect(() => {
    setCommittedAction(defaultCommittedAction);
  }, [defaultCommittedAction]);

  const handleSubmit = () => {
    const feedback = `我完成了 ACT 价值澄清。面对我的【${painfulFeeling}】，我接纳了自己，并深刻意识到我做这一切的背后是我深深在乎的价值：【${underlyingValue}】。我愿意学着自我接纳：『${acceptanceSentence}』。我庄严承诺执行以下微小行动：『${customAction}』。`;
    onExecute(feedback, {
      painful_feeling: painfulFeeling,
      underlying_value: underlyingValue,
      acceptance_sentence: acceptanceSentence,
      committed_action: customAction
    });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold">工具 2</span>
        <h4 className="font-semibold text-slate-900 text-base">ACT 情绪价值澄清</h4>
      </div>

      <div className="space-y-4 mb-4">
        {/* 当前痛苦 */}
        <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-teal-100/50">
          <span className="text-xs text-slate-400 font-medium tracking-wider block mb-1">🛑 当前痛苦的情绪：</span>
          <p className="text-sm font-semibold text-slate-800">{painfulFeeling}</p>
        </div>

        {/* 隐含价值 */}
        <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-teal-100/50">
          <span className="text-xs text-teal-600 font-medium tracking-wider block mb-1">💎 痛苦背后你真正珍视的价值（在乎什么）：</span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{underlyingValue}</p>
        </div>

        {/* 正念接纳 */}
        <div className="bg-teal-600/5 p-4 rounded-xl border border-teal-500/10 italic text-sm text-teal-800 leading-relaxed">
          <span className="not-italic text-xs font-semibold text-teal-700 block mb-1">✨ 温柔接纳指导语：</span>
          “{acceptanceSentence}”
        </div>

        {/* 承诺行动 */}
        <div className="bg-white/90 p-4 rounded-xl border border-teal-100 shadow-sm">
          <span className="text-xs text-slate-400 font-medium tracking-wider block mb-1.5">🎯 承诺的微小行动计划：</span>
          {isExecuted ? (
            <p className="text-sm text-slate-800 font-medium">{resultData?.committed_action || defaultCommittedAction}</p>
          ) : (
            <textarea
              value={customAction}
              onChange={(e) => setCommittedAction(e.target.value)}
              className="w-full text-sm font-medium bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-lg p-2.5 text-slate-800 focus:outline-none transition-all resize-none"
              rows={2}
            />
          )}
        </div>
      </div>

      {/* 确认 */}
      {!isExecuted ? (
        <div className="space-y-3">
          <label className="flex items-start space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <span className="text-xs text-slate-600 leading-tight">
              我愿意允许焦虑暂时存在，接纳这些感受，并承诺践行以上的微小行动。
            </span>
          </label>
          <button
            onClick={handleSubmit}
            disabled={!accepted}
            className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm ${accepted ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            ✓ 确立承诺，开始付诸行动
          </button>
        </div>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-teal-600 font-medium rounded-xl text-sm border border-teal-200 cursor-not-allowed">
          ✓ ACT 价值澄清已确认，承诺行动中
        </button>
      )}
    </div>
  );
};

/**
 * 3. SFBT 例外经验与小目标组件 (工具 5)
 */
const SfbtGoalWidget: React.FC<{ args: any; onExecute: (r: string, d: any) => void; isExecuted: boolean; resultData?: any }> = ({
  args = {},
  onExecute,
  isExecuted,
  resultData
}) => {
  const exception = args?.exception || '过去情况稍微好一些、或能够专心做一件事的时刻。';
  const resource = args?.resource || '你自身具有的自我克制力、环境调节能力或朋友的支持。';
  const defaultSmallGoal = args?.small_goal || '今晚先写下明天的第一件小任务，做好最基本准备。';
  const defaultConfidenceScore = typeof args?.confidence_score === 'number' ? args.confidence_score : 7;

  const [score, setScore] = useState(defaultConfidenceScore);
  const [customGoal, setCustomGoal] = useState(defaultSmallGoal);

  // 参数有变化时同步
  useEffect(() => {
    setScore(defaultConfidenceScore);
    setCustomGoal(defaultSmallGoal);
  }, [defaultSmallGoal, defaultConfidenceScore]);

  const handleSubmit = () => {
    const feedback = `我完成了 SFBT 例外寻找。回想我的例外经验【${exception}】，我发现了我自身的可用资源与优势：【${resource}】。我为自己确立了一个今晚就能去做的最小目标：『${customGoal}』。我对自己完成该小目标的信心指数是：${score}/10 分。`;
    onExecute(feedback, {
      exception,
      resource,
      small_goal: customGoal,
      confidence_score: score
    });
  };

  return (
    <div className="my-3 p-5 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl shadow-sm text-slate-800">
      <div className="flex items-center space-x-2 mb-3">
        <span className="p-1.5 bg-sky-500 text-white rounded-lg text-xs font-bold">工具 3</span>
        <h4 className="font-semibold text-slate-900 text-base">SFBT 例外搜寻与赋能小目标</h4>
      </div>

      <div className="space-y-4 mb-4">
        {/* 成功例外 */}
        <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-sky-100/50">
          <span className="text-xs text-sky-600 font-semibold tracking-wider block mb-1">🌟 寻找例外（事情稍好、你做得对的时候）：</span>
          <p className="text-sm font-medium text-slate-800 leading-relaxed">{exception}</p>
        </div>

        {/* 优势资源 */}
        <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-sky-100/50">
          <span className="text-xs text-slate-400 font-medium tracking-wider block mb-1">🎒 提炼你自身可用的资源与力量：</span>
          <p className="text-sm font-semibold text-slate-800">{resource}</p>
        </div>

        {/* 最小行动目标 */}
        <div className="bg-white/90 p-4 rounded-xl border border-sky-100 shadow-sm">
          <span className="text-xs text-sky-600 font-semibold tracking-wider block mb-1.5">⛳ 设定当前可以立刻达到的最小目标：</span>
          {isExecuted ? (
            <p className="text-sm text-slate-800 font-semibold">{resultData?.small_goal || defaultSmallGoal}</p>
          ) : (
            <textarea
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg p-2.5 text-slate-800 focus:outline-none transition-all resize-none"
              rows={2}
            />
          )}
        </div>

        {/* 信心分数滑块 */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-sky-100/50">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-medium">🎯 你对完成该小目标的信心指数：</span>
            <span className="text-sm font-bold text-sky-600">{isExecuted ? (resultData?.confidence_score || score) : score} / 10 分</span>
          </div>
          {!isExecuted ? (
            <input
              type="range"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          ) : (
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full" style={{ width: `${(resultData?.confidence_score || score) * 10}%` }} />
            </div>
          )}
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>完全没信心</span>
            <span>中等</span>
            <span>信心十足！</span>
          </div>
        </div>
      </div>

      {!isExecuted ? (
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/20"
        >
          ✨ 确定我的小目标并激活能量
        </button>
      ) : (
        <button disabled className="w-full py-2.5 bg-slate-100 text-sky-600 font-medium rounded-xl text-sm border border-sky-200 cursor-not-allowed">
          ✓ 例外探索已完成，小目标推进中
        </button>
      )}
    </div>
  );
};
