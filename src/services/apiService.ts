import { Message, ToolCall } from '../types/chat';
import { SYSTEM_PROMPT, TOOLS_DEFINITIONS } from './promptConfig';

const DEFAULT_API_BASE_URL = 'https://api.deepseek.com/v1';

export class ApiService {
  private apiKey: string = '';
  private apiBaseUrl: string = DEFAULT_API_BASE_URL;

  constructor() {
    // Attempt to load from localStorage
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) {
      this.apiKey = savedKey;
    }
    const savedUrl = localStorage.getItem('deepseek_api_url');
    if (savedUrl) {
      this.apiBaseUrl = savedUrl;
    }
  }

  setApiKey(key: string, baseUrl?: string) {
    this.apiKey = key.trim();
    localStorage.setItem('deepseek_api_key', this.apiKey);
    
    if (baseUrl) {
      this.apiBaseUrl = baseUrl.trim();
      localStorage.setItem('deepseek_api_url', this.apiBaseUrl);
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  clearSettings() {
    this.apiKey = '';
    this.apiBaseUrl = DEFAULT_API_BASE_URL;
    localStorage.removeItem('deepseek_api_key');
    localStorage.removeItem('deepseek_api_url');
  }

  /**
   * Check if a message matches suicidal or self-harm risk keywords
   * Enhanced with more comprehensive crisis keywords and semantic patterns
   */
  checkCrisisRisk(text: string): boolean {
    const riskKeywords = [
      // 直接自杀/自伤表达
      '不想活', '自杀', '想死', '轻生', '割腕', '吃药自杀', '人间不值得',
      '放弃生命', '结束痛苦', '想解脱', '没有意义了想死', '自残',
      '活着太痛苦了想死', '跳楼', '烧炭', '上吊', '割颈',
      // 间接表达
      '活着没意思', '不如死了算了', '我走了', '再见了世界', '来世再见',
      '下辈子', '解脱吧', '停止痛苦', '想消失', '不存在就好了',
      // 绝望表达
      '看不到希望', '没有未来', '没人在乎我', '我是负担', '我不在了',
      '你们会更好的', '不用管我了',
      // 英文（支持中英文混合输入）
      'suicide', 'kill myself', 'end my life', 'don\'t want to live', 'no hope'
    ];
    const cleanedText = text.toLowerCase().replace(/\s+/g, '');
    return riskKeywords.some(keyword => cleanedText.includes(keyword.toLowerCase().replace(/\s+/g, '')));
  }

  /**
   * Send conversation to DeepSeek API with Tools declared
   */
  async sendChatMessage(messages: Message[]): Promise<{ message: Message; rawResponse?: any }> {
    if (!this.apiKey) {
      // Trigger simulation mode if no API Key is set yet
      return this.simulateLocalResponse(messages);
    }

    try {
      // Format messages for the API (strip client-only UI flags)
      const apiMessages = messages.map(msg => {
        const payload: any = {
          role: msg.role,
          content: msg.content
        };
        if (msg.name) payload.name = msg.name;
        if (msg.tool_call_id) payload.tool_call_id = msg.tool_call_id;
        if (msg.tool_calls) payload.tool_calls = msg.tool_calls;
        return payload;
      });

      // Inject system prompt if not present at start
      const hasSystem = apiMessages.some(m => m.role === 'system');
      if (!hasSystem) {
        apiMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
      }

      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: apiMessages,
          tools: TOOLS_DEFINITIONS,
          tool_choice: 'auto',
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 返回错误 (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const resMessage = choice.message;

      // Transform API response message to local UI Message type
      const resultMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        role: resMessage.role,
        content: resMessage.content || ''
      };

      if (resMessage.tool_calls) {
        resultMessage.tool_calls = resMessage.tool_calls.map((tc: any) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }));
      }

      return { message: resultMessage, rawResponse: data };

    } catch (error) {
      console.error('DeepSeek API 请求失败，切换至模拟疗愈应答：', error);
      // Fallback gracefully to high-quality psychological simulation if API throws an error
      return this.simulateLocalResponse(messages);
    }
  }

  /**
   * Premium psychological simulator for offline trial / API key fallback
   */
  private simulateLocalResponse(messages: Message[]): Promise<{ message: Message }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let responseContent = '';
        let toolCalls: ToolCall[] | undefined = undefined;

        // Find the last tool message and check if user sent a new message AFTER it
        const lastToolMsg = [...messages].reverse().find(m => m.role === 'tool');
        const lastToolIndex = lastToolMsg ? messages.findIndex(m => m.id === lastToolMsg.id) : -1;
        const hasNewUserMsgAfterTool = lastToolIndex >= 0 && messages.slice(lastToolIndex + 1).some(m => m.role === 'user');

        // Only provide tool closed-loop feedback if the tool was the VERY LAST interaction
        // (i.e. no new user message was sent after the tool result)
        if (lastToolMsg && !hasNewUserMsgAfterTool) {
          // If a tool was just executed, provide warm closed-loop feedback instead of triggering another tool
          if (lastToolMsg.name === 'breathing_relaxation') {
            responseContent = `太棒了！看到你能够静下心来完整做完这 4 轮呼吸训练，我感到无比欣慰。这不仅是向内的自我调节，更是你对疲惫、紧绷身体的一次极其温柔的照顾。💖
            
此时此刻，你是否感到胸口的闷胀感有些许减轻？手心有没有微微回温？如果你愿意，我们可以继续聊聊，或者就这么安静地陪着你歇一会儿。`;
          } else if (lastToolMsg.name === 'act_values_clarification') {
            responseContent = `我深深地为你感到骄傲。能够直面自己的痛苦，并从中提取出你真正珍视和在乎的核心价值，需要极大的觉察力和勇气。💎
            
你所写下的承诺行动虽然微小，但却是你夺回生活主动权、践行自我接纳最坚实的第一步。不需要急着一步登天，今晚就让我们先温柔地完成这个小动作。我会一直在这里陪伴你。接下来你还想聊点什么呢？`;
          } else if (lastToolMsg.name === 'sfbt_exception_goals') {
            responseContent = `太了不起了！寻找例外经验并确立信心，是我们打破"我什么都做不好"这个魔咒的开始。你刚刚提炼出的那些优势资源，一直都在你的身体和记忆深处闪闪发光。🌟
            
你给自己定的那个微小目标非常棒，并在信心滑块上给了自己很好的肯定。请相信自己的节奏，今晚让我们就从这一小步开始启动能量。你想再和我分享一下，接下来有什么具体的细节打算吗？`;
          } else if (lastToolMsg.name === 'gad7_assessment') {
            try {
              const gadData = JSON.parse(lastToolMsg.content);
              const totalScore = gadData.total_score || 0;
              let level = '', advice = '';
              if (totalScore <= 4) { level = '正常范围'; advice = '你目前的焦虑水平处于正常范围，请继续保持健康的生活方式！'; }
              else if (totalScore <= 9) { level = '轻度焦虑'; advice = '存在一些轻度焦虑信号，可以尝试呼吸放松和正念练习来调节。'; }
              else if (totalScore <= 14) { level = '中度焦虑'; advice = '焦虑水平偏高，建议结合CBT认知重构和放松训练，关注自己的情绪变化。'; }
              else { level = '中重度焦虑'; advice = '分数较高提示焦虑程度较重，强烈建议考虑寻求学校心理中心或专业咨询师的帮助。'; }
              responseContent = `感谢你认真完成了 GAD-7 焦虑自评。你的总分为 ${totalScore} 分，参考等级为【${level}】。
              
📋 **重要提醒**：这仅是一份自我筛查参考，不是医学诊断。${advice}

如果你想进一步调节焦虑，我们可以尝试呼吸放松训练或CBT认知重构工具。你希望从哪个方向开始呢？`;
            } catch {
              responseContent = `感谢你完成了 GAD-7 评估。请记住，这只是自我筛查参考，不能替代专业诊断。如果分数提示偏高，建议进一步关注自己的情绪状态，我们可以一起尝试一些调节方法。`;
            }
          } else if (lastToolMsg.name === 'cbt_cognitive_restructuring') {
            responseContent = `非常了不起！完成CBT认知重构需要极大的勇气和觉察力。你刚才所做的——识别那个自动蹦出来的消极想法、客观地寻找正反证据、最终形成更平衡的视角——这正是打破旧有思维模式的关键一步。🧠✨

每一次这样练习，都是在为你铺设一条新的、更温柔的思维路径。随着时间的推移，这些新的、平衡的想法会变得越来越自然。你想继续聊聊这个情境，还是想让我陪你做一个呼吸放松来巩固这份觉察？`;
          } else if (lastToolMsg.name === 'emotion_diary') {
            responseContent = `感谢你愿意把此刻的心情记录下来 💌。写情绪日记是非常棒的自我觉察练习——当我们能把模糊的感受变成清晰的文字时，情绪对我们的掌控力就已经在悄悄减弱了。

你可以把这篇日记保存在心里，或者养成每天睡前记录的习惯。长期坚持，你会发现自己的情绪模式变得越来越清晰，也能更早地发现自己需要关注和照顾的时刻。现在你想和我聊聊这些情绪吗？`;
          } else if (lastToolMsg.name === 'self_rating_mood') {
            try {
              const ratingData = JSON.parse(lastToolMsg.content);
              const score = ratingData.score || 5;
              // Check if there are previous before/after scores
              const allScores = messages.filter(m => m.name === 'self_rating_mood' && m.role === 'tool');
              if (allScores.length >= 2) {
                const firstScore = parseFirstScore(allScores);
                if (firstScore !== null && score > firstScore) {
                  responseContent = `太好了！看到你的情绪评分从 ${firstScore} 分提升到了 ${score} 分，这让我由衷地为你高兴！📈

这小小的数值变化背后，是你积极面对内心、主动寻求调节的真实努力。每一次微小的改善都值得被认真庆祝。你愿意分享一下，是什么让你感觉比之前好了一些吗？`;
                } else if (firstScore !== null && score <= firstScore) {
                  responseContent = `谢谢你再次为情绪打分。我注意到分数现在还是 ${score} 分，我知道这可能让你有些沮丧。但请相信，情绪本身就是有起伏的，暂时没有变化或有所波动都是非常正常的。

疗愈不是一条直线，而是一条有时高有时低的曲线。重要的是我们一直在关注自己、照顾自己。你还想继续和我聊一聊此刻的感受吗？`;
                } else {
                  responseContent = `谢谢你的评分！这个分数帮我更好地理解了你此刻的状态。无论分数是多少，最重要的是我们在一起面对。接下来你想从哪个角度开始照顾自己呢？`;
                }
              } else {
                responseContent = `感谢你的自评！无论分数如何，光是愿意停下来审视自己的状态，就是一份很难得的温柔了。我们可以基于这个起点，一起看看接下来可以从哪里开始。你愿意我先陪你做一个简短的放松呢，还是想继续聊聊让你烦恼的事情？`;
              }
            } catch {
              responseContent = `谢谢你花时间给情绪打分，这帮助我更好地理解了你此刻的状态。接下来我们可以根据这个起点，共同探索最适合你的调节方式。`;
            }
          } else {
            responseContent = `谢谢你完成了这个疗愈环节。在这个过程中，你的每一分倾听、思考和行动，都是对自己最好的赋能。请深吸一口气，我们接下来可以继续倾听你的感受。`;
          }
        } else {
          // Normal keyword matching logic
          const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
          const userText = lastUserMsg.trim();
          
          // 检查用户是否首次对话 → 先做情绪自评
          const userMsgCount = messages.filter(m => m.role === 'user').length;
          const hasSelfRating = messages.some(m => m.name === 'self_rating_mood');
          if (userMsgCount <= 1 && !hasSelfRating) {
            responseContent = `很高兴能在这里倾听你。在正式开始之前，我想先邀请你做一个简单的心情评分——就像我们量体温了解身体的温度一样，给情绪量一下"温度"能帮助我们更有方向地开始。`;
            toolCalls = [{
              id: `call-${Date.now()}-rating`,
              type: 'function',
              function: {
                name: 'self_rating_mood',
                arguments: JSON.stringify({
                  prompt: '如果 1 代表"极度低落与痛苦"，10 代表"非常平静与愉悦"，你现在的情绪在几分呢？',
                  min_label: '极度低落与痛苦',
                  max_label: '非常平静与愉悦',
                  current_estimated: 5
                })
              }
            }];
          } else if (userText.includes('焦虑') || userText.includes('担心') || userText.includes('不安') || userText.includes('害怕') || userText.includes('困扰')) {
            responseContent = '听你描述这些焦虑和不安的感受，我能感受到你现在心里那种挥之不去的紧张感。有时候焦虑像一层薄雾笼罩着生活，让一切都变得沉重而模糊。我想先用一个简单的GAD-7问卷帮你更清楚地了解自己当前的状态，然后我们再一起制定合适的调节方案，好吗？';
            toolCalls = [{
              id: `call-${Date.now()}-gad7`,
              type: 'function',
              function: {
                name: 'gad7_assessment',
                arguments: JSON.stringify({
                  tool_name: 'gad7_assessment',
                  introduction: '这是一份简单的7题问卷，可以帮助你大致了解近两周的焦虑水平。请根据你的真实感受作答，这不是医学诊断，仅作为自我筛查参考。',
                  instruction: '请回想过去两周内，以下问题困扰你的频率。'
                })
              }
            }];
          } else if (userText.includes('为什么是我') || userText.includes('都是我的错') || userText.includes('我不行') || userText.includes('别人怎么看') || userText.includes('万一') || userText.includes('肯定又') || userText.includes('想太多')) {
            responseContent = '我听到你内心那个一直在批评自己的声音了——它总是在说『我不行』、『都是我的错』或『肯定又会搞砸』。这在CBT认知行为疗法中，我们称之为"自动消极思维"，它们是长期形成的思维习惯，像是大脑里的快捷通道。好消息是：这些思维模式是可以被识别和改变的。我们来做一次CBT认知重构训练吧，好吗？';
            toolCalls = [{
              id: `call-${Date.now()}-cbt`,
              type: 'function',
              function: {
                name: 'cbt_cognitive_restructuring',
                arguments: JSON.stringify({
                  situation: '触发这些负面想法的具体情境',
                  automatic_thought: '我不行，我肯定又会搞砸',
                  emotion_and_intensity: '焦虑、自我怀疑，强度约 7/10',
                  cognitive_distortion: '灾难化、以偏概全、读心术'
                })
              }
            }];
          } else if (userText.includes('写日记') || userText.includes('记录') || userText.includes('日记') || userText.includes('今天的心情') || userText.includes('总结一下')) {
            responseContent = '愿意记录心情是很好的习惯！情绪日记就像给自己的心灵拍一张快照，帮助我们更客观地观察自己。来，我们一起记录一下此刻的感受吧。';
            toolCalls = [{
              id: `call-${Date.now()}-diary`,
              type: 'function',
              function: {
                name: 'emotion_diary',
                arguments: JSON.stringify({
                  prompt: '和我一起记录一下今天的心情吧 —— 今天主要经历了哪些情绪？是什么事情触发了它们？',
                  suggested_emotions: ['疲惫', '焦虑', '平静', '希望', '孤独', '满足']
                })
              }
            }];
          } else if (userText.includes('呼吸') || userText.includes('手抖') || userText.includes('紧张') || userText.includes('极其') || userText.includes('慌张') || userText.includes('失眠')) {
            responseContent = '听到你这么说，我能真切地感受到你现在身体和内心的紧绷状态。当这种情绪席卷而来时，身体会本能地出现手抖或呼吸急促，这都是正常的。为了帮助你恢复平静，我们现在一起做个呼吸放松训练吧，它能快速安抚我们的自主神经系统。';
            toolCalls = [{
              id: `call-${Date.now()}-relaxation`,
              type: 'function',
              function: {
                name: 'breathing_relaxation',
                arguments: JSON.stringify({
                  tool_name: 'breathing_training',
                  method: '4-7-8 呼吸法',
                  duration: '3分钟',
                  steps: ['吸气 4 秒', '屏息 7 秒', '呼气 8 秒', '重复 4 轮'],
                  expected_effect: '降低生理唤醒水平，瞬间平复胸口堵塞与手部抖动'
                })
              }
            }];
          } else if (userText.includes('没意义') || userText.includes('内耗') || userText.includes('迷茫') || userText.includes('责备自己') || userText.includes('焦虑')) {
            responseContent = '谢谢你愿意向我倾诉这些深刻的无力与内耗。感觉"没有意义"或陷入长期的焦虑自责，往往是因为我们在乎很多事情，却在沉重的压力中迷失了方向。根据接纳承诺疗法（ACT），我们不必拼命消灭焦虑，而是可以接纳它，并找到它背后对你而言真正重要的事情。我们来做一次【价值澄清】吧。';
            toolCalls = [{
              id: `call-${Date.now()}-act`,
              type: 'function',
              function: {
                name: 'act_values_clarification',
                arguments: JSON.stringify({
                  painful_feeling: '极度焦虑与自我谴责',
                  underlying_value: '渴望有条理地掌控生活、期待实现自我成长与获得认可',
                  acceptance_sentence: '我可以接纳这份焦虑像一阵微风吹过我身体，我不急于驱散它，而是与它平静地共处一小会儿。',
                  committed_action: '今晚先合上眼休息 10 分钟，不看手机，给疲惫的自己一个温柔的拥抱和陪伴。'
                })
              }
            }];
          } else if (userText.includes('总是失败') || userText.includes('什么都做不好') || userText.includes('完蛋了') || userText.includes('没希望') || userText.includes('拖延')) {
            responseContent = '当感到无望和一切都很糟糕时，我们的眼睛就像戴上了一副"放大问题"的眼镜，把所有的失败都放大了。但我相信，你的经历中一定有某些时刻，情况其实没有那么严重，或者你曾经做对过一些事情。在焦点解决短期治疗（SFBT）中，这些被称为"例外经验"。我们一起来寻找这些属于你的力量和资源，并设置一个小目标，好吗？';
            toolCalls = [{
              id: `call-${Date.now()}-sfbt`,
              type: 'function',
              function: {
                name: 'sfbt_exception_goals',
                arguments: JSON.stringify({
                  exception: '上个月有一次虽然也想拖延，但通过设置了"白噪背景音"，坚持专心学习了20分钟',
                  resource: '懂得创造无干扰的物理环境，并拥有在短时间内集中精力的能力',
                  small_goal: '今晚只开启白噪音 5 分钟，把明天的主要待办事项写在一张便利贴上',
                  confidence_score: 8
                })
              }
            }];
          } else {
            // General Empathetic Response
            responseContent = `听到你的诉说，我心里能感到一种热乎乎且有些酸涩的共鸣。你此时此刻正在经历的艰难，压在身上一定特别沉重。很多时候，我们不需要立刻找到所有的答案，单单是允许自己"现在有些难受，现在可以歇一歇"，就已经是一种极大的勇敢了。

我们可以试着先从最困扰你的事情聊起。你可以试试以下工具：
🧘 **呼吸放松** — 如果身体特别紧绷、失眠或心慌
📋 **GAD-7 焦虑评估** — 如果想更客观地了解焦虑水平
🔍 **CBT 认知重构** — 如果脑子总被消极想法占据
💎 **ACT 价值澄清** — 如果感到迷茫、内耗或自我责备
🌟 **SFBT 小目标** — 如果感觉无力、拖延、不知从何入手
📝 **情绪日记** — 如果想记录和整理当下的心情

你最希望从哪里开始呢？`;
          }
        }

        const simMessage: Message = {
          id: `msg-sim-${Date.now()}`,
          role: 'assistant',
          content: responseContent,
          tool_calls: toolCalls
        };

        resolve({ message: simMessage });
      }, 800);
    });
  }
  /**
   * Streaming version: Send conversation to DeepSeek API with SSE streaming support.
   * @param messages - conversation history
   * @param callbacks - callbacks for handling stream events
   */
  async streamChatMessage(
    messages: Message[],
    callbacks: {
      onContentDelta: (delta: string, fullContent: string) => void;
      onToolCalls: (toolCalls: ToolCall[]) => void;
      onError: (error: Error) => void;
      onDone: () => void;
    }
  ): Promise<void> {
    if (!this.apiKey) {
      return this.simulateStreamResponse(messages, callbacks);
    }

    try {
      const apiMessages = messages.map(msg => {
        const payload: any = {
          role: msg.role,
          content: msg.content
        };
        if (msg.name) payload.name = msg.name;
        if (msg.tool_call_id) payload.tool_call_id = msg.tool_call_id;
        if (msg.tool_calls) payload.tool_calls = msg.tool_calls;
        return payload;
      });

      const hasSystem = apiMessages.some((m: any) => m.role === 'system');
      if (!hasSystem) {
        apiMessages.unshift({ role: 'system', content: SYSTEM_PROMPT });
      }

      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: apiMessages,
          tools: TOOLS_DEFINITIONS,
          tool_choice: 'auto',
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 返回错误 (${response.status}): ${errText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      const toolCallsBuffer: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            callbacks.onDone();
            return;
          }

          try {
            const json = JSON.parse(data);
            const choice = json.choices?.[0];
            if (!choice) continue;

            const delta = choice.delta;
            if (!delta) continue;

            if (delta.content) {
              fullContent += delta.content;
              callbacks.onContentDelta(delta.content, fullContent);
            }

            if (delta.tool_calls) {
              for (const tcDelta of delta.tool_calls) {
                const idx = tcDelta.index ?? 0;
                if (!toolCallsBuffer[idx]) {
                  toolCallsBuffer[idx] = {
                    id: '',
                    type: 'function',
                    function: { name: '', arguments: '' }
                  };
                }
                if (tcDelta.id) toolCallsBuffer[idx].id = tcDelta.id;
                if (tcDelta.function?.name) toolCallsBuffer[idx].function.name = tcDelta.function.name;
                if (tcDelta.function?.arguments) toolCallsBuffer[idx].function.arguments += tcDelta.function.arguments;
              }
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }

      if (toolCallsBuffer.length > 0) {
        const toolCalls: ToolCall[] = toolCallsBuffer.map((tc: any) => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }));
        callbacks.onToolCalls(toolCalls);
      }

      callbacks.onDone();
    } catch (error: any) {
      console.error('DeepSeek API 流式请求失败，切换至模拟疗愈应答：', error);
      try {
        await this.simulateStreamResponse(messages, callbacks);
      } catch (simError: any) {
        callbacks.onError(simError);
      }
    }
  }

  /**
   * Simulate streaming response for local/offline mode.
   * Generates the full response first, then streams it character by character.
   */
  private async simulateStreamResponse(
    messages: Message[],
    callbacks: {
      onContentDelta: (delta: string, fullContent: string) => void;
      onToolCalls: (toolCalls: ToolCall[]) => void;
      onError: (error: Error) => void;
      onDone: () => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      // First generate the full response (reuse same logic)
      this.simulateLocalResponse(messages).then(({ message }) => {
        const content = message.content || '';
        const toolCalls = message.tool_calls;

        // Stream out character by character with small delay
        let fullContent = '';
        let idx = 0;
        const chunkSize = 2; // characters per tick
        const tickMs = 25;     // ms per tick

        const tick = () => {
          if (idx >= content.length) {
            // Content done, now handle tool calls
            if (toolCalls && toolCalls.length > 0) {
              callbacks.onToolCalls(toolCalls);
            }
            callbacks.onDone();
            resolve();
            return;
          }
          const chunk = content.slice(idx, idx + chunkSize);
          idx += chunkSize;
          fullContent += chunk;
          callbacks.onContentDelta(chunk, fullContent);
          setTimeout(tick, tickMs);
        };

        // Small initial delay to simulate "thinking"
        setTimeout(tick, 600);
      });
    });
  }
}

function parseFirstScore(messages: Message[]): number | null {
  const firstRating = [...messages].reverse().find(m => m.name === 'self_rating_mood');
  if (firstRating) {
    try {
      const data = JSON.parse(firstRating.content);
      return data.score ?? null;
    } catch { return null; }
  }
  return null;
}

export const apiService = new ApiService();
