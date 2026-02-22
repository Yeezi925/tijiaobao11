/**
 * 阿里云通义千问 API 集成模块
 * 用于生成 AI 训练建议和教案
 */

import axios from "axios";

/**
 * 调用通义千问 API 生成内容
 */
async function callQianwenAPI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.QIANWEN_API_KEY;
  
  if (!apiKey) {
    throw new Error("通义千问 API Key 未配置");
  }

  try {
    console.log("[通义千问 API] 开始调用...");

    const response = await axios.post(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
        model: "qwen-plus",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt }
        ],
        parameters: {
          temperature: 0.7,
          max_tokens: 2000
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("[通义千问 API] 调用成功");

    // 提取响应内容
    if (response.data?.output?.text) {
      return response.data.output.text;
    }

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    throw new Error("通义千问 API 返回空响应");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[通义千问 API 错误]", error.response?.status, error.response?.data);
      throw new Error(`通义千问 API 请求失败: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
    console.error("[通义千问 API 错误]", error);
    throw error;
  }
}

/**
 * 调用通义千问 API 生成 AI 训练建议
 */
export async function generateTrainingAdvice(studentInfo: {
  name: string;
  gender: string;
  grade?: string;
  class?: string;
  total40: number;
  longContrib?: number;
  ballContrib?: number;
  selectContrib?: number;
}): Promise<string> {
  const systemPrompt = `你是一位专业的体育教练和训练顾问。根据学生的体育成绩，为其提供个性化的训练建议。
  
评分标准：
- 总分：40分制
- 长跑/游泳：15分
- 球类项目：9分
- 选考项目（两项）：各8分

请根据学生的成绩分析其优势和不足，提供具体的训练建议。`;

  let userPrompt = `请为以下学生提供训练建议：

姓名：${studentInfo.name}
性别：${studentInfo.gender}`;

  if (studentInfo.grade) {
    userPrompt += `\n年段：${studentInfo.grade}`;
  }

  if (studentInfo.class) {
    userPrompt += `\n班级：${studentInfo.class}`;
  }

  userPrompt += `\n总分：${studentInfo.total40}/40分
长跑/游泳得分：${studentInfo.longContrib || 0}/15分
球类项目得分：${studentInfo.ballContrib || 0}/9分
选考项目得分：${studentInfo.selectContrib || 0}/16分

请提供：
1. 成绩分析（优势和不足）
2. 具体的训练建议（3-5条）
3. 预期改进目标`;

  return callQianwenAPI(userPrompt, systemPrompt);
}

/**
 * 调用通义千问 API 生成教案
 */
export async function generateLessonPlan(params: {
  topic: string;
  grade?: string;
  duration?: string;
  curriculum?: string;
  template?: string;
  userMessage: string;
}): Promise<string> {
  const systemPrompt = `你是一位经验丰富的体育教师和教案设计专家。根据用户提供的课程信息，为其生成专业的体育教案。

教案应包含以下内容：
- 教学目标
- 教学重点和难点
- 教学过程（导入、新授、练习、总结）
- 教学反思
- 作业设计

请确保教案符合中国体育课程标准，适合学生年龄段。`;

  let userPrompt = `请为我生成一份体育教案。

课程主题：${params.topic}`;

  if (params.grade) {
    userPrompt += `\n年段/班级：${params.grade}`;
  }

  if (params.duration) {
    userPrompt += `\n课程时长：${params.duration}`;
  }

  if (params.curriculum) {
    userPrompt += `\n课程标准：${params.curriculum}`;
  }

  if (params.template) {
    userPrompt += `\n参考模板：\n${params.template}`;
  }

  userPrompt += `\n\n用户需求：${params.userMessage}`;

  return callQianwenAPI(userPrompt, systemPrompt);
}

/**
 * 测试通义千问 API 连接
 */
export async function testDoubaoConnection(): Promise<boolean> {
  try {
    console.log("[通义千问连接测试] 开始测试...");
    const result = await generateTrainingAdvice({
      name: "测试学生",
      gender: "男",
      total40: 30,
      longContrib: 12,
      ballContrib: 7,
      selectContrib: 11
    });
    console.log("[通义千问连接测试] 成功");
    return !!result;
  } catch (error) {
    console.error("[通义千问连接测试失败]", error);
    return false;
  }
}
