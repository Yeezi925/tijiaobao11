/**
 * 体教宝 - 主页面
 * 
 * 功能模块：
 * 1. Excel 导入与成绩解析
 * 2. 学生成绩查询与展示
 * 3. 数据统计与分析
 * 4. AI 训练建议生成
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Users, Download, Trash2, Sparkles } from "lucide-react";
import { StudentRecord, calculateStatistics } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { toast } from "sonner";

const STORAGE_KEY = "tijiaobao_scores";

export default function Home() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("import");

  // 初始化：从本地存储加载数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    }
  }, []);

  // 保存到本地存储
  const saveToStorage = (data: StudentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const records = await parseExcelFile(file);
      setStudents(records);
      setFilteredStudents(records);
      saveToStorage(records);
      toast.success(`成功导入 ${records.length} 条学生记录`);
      setActiveTab("query");
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }

    const q = query.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q) ||
        s.grade?.toLowerCase().includes(q)
    );
    setFilteredStudents(filtered);
  };

  // 清空数据
  const handleClearData = () => {
    if (confirm("确定要清空所有数据吗？此操作不可撤销。")) {
      setStudents([]);
      setFilteredStudents([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("数据已清空");
    }
  };

  // 导出数据
  const handleExport = async () => {
    if (students.length === 0) {
      toast.error("没有可导出的数据");
      return;
    }

    try {
      await exportToExcel(students);
      toast.success("导出成功");
    } catch (error) {
      toast.error("导出失败");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">体教宝</h1>
              <p className="text-sm text-muted-foreground">现代化体育成绩管理系统</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已导入: <span className="font-semibold text-foreground">{students.length}</span> 条记录
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">导入</span>
            </TabsTrigger>
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">查询</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">分析</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          {/* 导入标签页 */}
          <TabsContent value="import" className="space-y-4">
            <Card className="p-8">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">导入 Excel 文件</h2>
                <p className="text-sm text-muted-foreground">
                  支持 .xlsx, .xls, .csv 格式。请确保 Excel 包含以下列：姓名、班级、性别、各项成绩
                </p>

                <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center hover:bg-primary/5 transition-colors">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-primary" />
                      <p className="font-medium">点击选择文件或拖拽上传</p>
                      <p className="text-xs text-muted-foreground">支持 Excel 和 CSV 格式</p>
                    </div>
                  </label>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>正在处理...</span>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">学生成绩查询</h2>

                <div className="flex gap-2">
                  <Input
                    placeholder="搜索姓名、班级或年级..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {students.length === 0 ? "请先导入 Excel 文件" : "没有找到匹配的记录"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary">
                          <th className="px-4 py-2 text-left font-semibold">姓名</th>
                          <th className="px-4 py-2 text-left font-semibold">班级</th>
                          <th className="px-4 py-2 text-center font-semibold">性别</th>
                          <th className="px-4 py-2 text-center font-semibold">总分</th>
                          <th className="px-4 py-2 text-center font-semibold">长跑/游泳</th>
                          <th className="px-4 py-2 text-center font-semibold">球类</th>
                          <th className="px-4 py-2 text-center font-semibold">选考</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium">{student.name}</td>
                            <td className="px-4 py-3">{student.class || "-"}</td>
                            <td className="px-4 py-3 text-center">{student.gender}</td>
                            <td className="px-4 py-3 text-center font-semibold text-primary">
                              {student.total40}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">{student.longContrib}</td>
                            <td className="px-4 py-3 text-center text-sm">{student.ballContrib}</td>
                            <td className="px-4 py-3 text-center text-sm">{student.selectContrib}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    导出 Excel
                  </Button>
                  <Button onClick={handleClearData} variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    清空数据
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">数据统计分析</h2>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  请先导入数据以查看统计信息
                </div>
              ) : (
                <AnalysisPanel students={students} />
              )}
            </Card>
          </TabsContent>

          {/* AI 建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI 训练建议</h2>
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>此功能需要配置 AI API 密钥</p>
                <p className="text-xs mt-2">敬请期待完整版本</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/**
 * 分析面板组件
 */
function AnalysisPanel({ students }: { students: StudentRecord[] }) {
  const stats = calculateStatistics(students);

  if (!stats) {
    return <div className="text-center text-muted-foreground">无法计算统计数据</div>;
  }

  const scoreDistribution = {
    excellent: students.filter((s) => parseFloat(s.total40 || "0") >= 36).length,
    good: students.filter((s) => {
      const score = parseFloat(s.total40 || "0");
      return score >= 30 && score < 36;
    }).length,
    pass: students.filter((s) => {
      const score = parseFloat(s.total40 || "0");
      return score >= 20 && score < 30;
    }).length,
    low: students.filter((s) => parseFloat(s.total40 || "0") < 20).length
  };

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="总人数" value={stats.count.toString()} />
        <StatCard label="平均分" value={stats.avgTotal} />
        <StatCard label="优秀率" value={stats.excellentRate} />
        <StatCard label="及格率" value={stats.passRate} />
      </div>

      {/* 成绩分布 */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <h3 className="font-semibold mb-4">成绩分布</h3>
        <div className="space-y-3">
          <DistributionBar label="优秀 (≥36分)" count={scoreDistribution.excellent} total={stats.count} color="bg-green-500" />
          <DistributionBar label="良好 (30-35分)" count={scoreDistribution.good} total={stats.count} color="bg-blue-500" />
          <DistributionBar label="及格 (20-29分)" count={scoreDistribution.pass} total={stats.count} color="bg-yellow-500" />
          <DistributionBar label="不及格 (<20分)" count={scoreDistribution.low} total={stats.count} color="bg-red-500" />
        </div>
      </div>

      {/* 各项平均分 */}
      <div className="bg-secondary/50 rounded-lg p-4">
        <h3 className="font-semibold mb-4">各项平均得分</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgLong}</p>
            <p className="text-xs text-muted-foreground">长跑/游泳</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgBall}</p>
            <p className="text-xs text-muted-foreground">球类</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgSelect}</p>
            <p className="text-xs text-muted-foreground">选考项目</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 统计卡片组件
 */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

/**
 * 分布条形图组件
 */
function DistributionBar({
  label,
  count,
  total,
  color
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = (count / total) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
