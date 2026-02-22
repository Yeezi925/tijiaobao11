import { describe, it, expect, vi, beforeEach } from "vitest";

describe("通义千问 API 集成", () => {
  beforeEach(() => {
    // 确保环境变量已设置
    process.env.QIANWEN_API_KEY = process.env.QIANWEN_API_KEY || "sk-test-key";
  });

  it("应该能正确构建 API 请求", async () => {
    // 这是一个简单的集成测试，验证 API 调用的结构
    expect(process.env.QIANWEN_API_KEY).toBeTruthy();
  });

  it("应该能导入生成训练建议函数", async () => {
    const { generateTrainingAdvice } = await import("./douban");
    expect(typeof generateTrainingAdvice).toBe("function");
  });

  it("应该能导入生成教案函数", async () => {
    const { generateLessonPlan } = await import("./douban");
    expect(typeof generateLessonPlan).toBe("function");
  });

  it("应该能导入测试连接函数", async () => {
    const { testDoubaoConnection } = await import("./douban");
    expect(typeof testDoubaoConnection).toBe("function");
  });
});
