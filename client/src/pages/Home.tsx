/**
 * 体教宝 - 主页面 (最终版)
 * 
 * 功能模块：
 * 1. Excel 导入与成绩解析（与查询合并）
 * 2. 多层级学生成绩查询（学校、年段、班级、个人）
 * 3. 完整的数据统计与分析（按40分制显示）
 * 4. AI 训练建议生成
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Sparkles, Download, Trash2, Copy } from "lucide-react";
import { StudentRecord } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import AIAdvice from "./AIAdvice";
import LessonPlanGenerator from "./LessonPlanGenerator";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tijiaobao_scores";

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(true);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("query");
  const [shareCode, setShareCode] = useState("");
  const [showShareCode, setShowShareCode] = useState(false);

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  // 分析过滤器
  const [analysisLevel, setAnalysisLevel] = useState<"school" | "year" | "class">("school");
  const [analysisGrade, setAnalysisGrade] = useState("");
  const [analysisClass, setAnalysisClass] = useState("");
  const [showGenderCompare, setShowGenderCompare] = useState(false);

  // 初始化：检查权限和加载数据
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (!userRole || userRole !== "teacher") {
      window.location.href = "/login";
      return;
    }
    setIsAuthorized(true);
    
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

  if (!isAuthorized) {
    return null;
  }

  // 保存到本地存储
  const saveToStorage = (data: StudentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // tRPC 保存学生数据
  const saveStudentMutation = trpc.teacher.saveStudentData.useMutation({
    onSuccess: () => {
      toast.success("学生数据已保存到数据库");
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  // tRPC 创建分享链接
  const createShareLinkMutation = trpc.teacher.createShareLink.useMutation({
    onSuccess: (data) => {
      if (data.shareCode) {
        setShareCode(data.shareCode);
        setShowShareCode(true);
        toast.success(`分享码已生成: ${data.shareCode}`);
      }
    },
    onError: (error) => {
      toast.error(`生成分享码失败: ${error.message}`);
    },
  });

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
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 导出为 Excel
  const handleExportExcel = async () => {
    try {
      await exportToExcel(filteredStudents, "学生成绩数据.xlsx");
      toast.success("导出成功");
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败");
    }
  };

  // 保存到数据库
  const handleSaveToDatabase = async () => {
    if (students.length === 0) {
      toast.error("没有数据可保存");
      return;
    }

    if (isLoading || saveStudentMutation.isPending) {
      toast.error("正在保存中，请不要重复点击");
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      for (const student of students) {
        try {
          await saveStudentMutation.mutateAsync({
            name: student.name,
            grade: student.grade,
            class: student.class,
            school: student.school,
            gender: student.gender as "男" | "女",
            longrun: student.longrun,
            swim: student.swim,
            long100: student.long100,
            longContrib: student.longContrib?.toString(),
            football: student.football,
            basketball: student.basketball,
            volleyball: student.volleyball,
            ballContrib: student.ballContrib?.toString(),
            run50: student.run50,
            situp: student.situp,
            ball: student.ball,
            rope: student.rope,
            pullup: student.pullup,
            jump: student.jump,
            selectContrib: student.selectContrib?.toString(),
            selectedProjects: student.selectedProjects ? JSON.stringify(student.selectedProjects) : undefined,
            total40: student.total40?.toString(),
            status: student.status,
          });
          successCount++;
        } catch (studentError) {
          console.error(`保存学生 ${student.name} 失败:`, studentError);
          failedCount++;
        }
      }

      if (failedCount === 0) {
        toast.success(`已保存 ${successCount} 条学生记录到数据库`);
      } else {
        toast.warning(`已保存 ${successCount} 条，失败 ${failedCount} 条`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 生成分享链接
  const handleGenerateShareLink = async () => {
    if (students.length === 0) {
      toast.error("没有数据可分享");
      return;
    }

    setIsLoading(true);
    try {
      // 使用 tRPC 生成分享链接
      await createShareLinkMutation.mutateAsync({
        title: "学生成绩分享",
        description: `分享 ${students.length} 名学生的成绩数据`,
        studentIds: students.map((_, idx) => idx + 1),
      });
    } catch (error) {
      console.error("生成分享码失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                体教宝
              </h1>
              <p className="text-sm text-muted-foreground">现代化体育成绩管理系统</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">已导入</p>
                <p className="text-2xl font-bold text-primary">{students.length}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("userRole");
                  window.location.href = "/login";
                }}
              >
                退出登入
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">导入/查询</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">分析</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="lesson" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">教案</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">数据管理</span>
            </TabsTrigger>
          </TabsList>

          {/* 导入/查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {/* 导入区域 */}
            {students.length === 0 && (
              <Card className="p-8 bg-white">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">导入 Excel 文件</h2>
                  <p className="text-sm text-muted-foreground">
                    选择包含学生成绩数据的 Excel 文件进行导入
                  </p>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-semibold">点击选择文件或拖拽上传</p>
                      <p className="text-sm text-muted-foreground">支持 .xlsx 和 .xls 格式</p>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* 已导入数据的操作区 */}
            {students.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">已导入数据操作</h2>
                <div className="space-y-4">
                  {/* 查询部分 */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">查询方式</label>
                      <select
                        value={queryType}
                        onChange={(e) => setQueryType(e.target.value as "all" | "grade" | "class" | "name")}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="all">全部学生</option>
                        <option value="grade">按年段</option>
                        <option value="class">按班级</option>
                        <option value="name">按姓名</option>
                      </select>
                    </div>

                    {queryType === "grade" && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">选择年段</label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => setSelectedGrade(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                        >
                          <option value="">-- 选择年段 --</option>
                          {grades.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {queryType === "class" && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">选择班级</label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                        >
                          <option value="">-- 选择班级 --</option>
                          {classes.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {queryType === "name" && (
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground">输入姓名</label>
                        <Input
                          placeholder="搜索学生姓名..."
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* 成绩表格 */}
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      没有找到匹配的记录
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
                            <th className="px-4 py-3 text-left font-semibold">姓名</th>
                            <th className="px-4 py-3 text-left font-semibold">班级</th>
                            <th className="px-4 py-3 text-center font-semibold">总成绩</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student, idx) => (
                            <tr key={idx} className="border-b border-border hover:bg-blue-50">
                              <td className="px-4 py-3">{student.name}</td>
                              <td className="px-4 py-3">{student.class}</td>
                              <td className="px-4 py-3 text-center font-bold text-primary">{student.total40}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Button
                      onClick={() => document.getElementById("file-input")?.click()}
                      variant="outline"
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      重新导入
                    </Button>
                    <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      导出 Excel
                    </Button>
                    <Button onClick={handleSaveToDatabase} variant="default" className="gap-2" disabled={saveStudentMutation.isPending || isLoading}>
                      <Sparkles className="w-4 h-4" />
                      {saveStudentMutation.isPending ? "保存中..." : "保存到数据库"}
                    </Button>
                    <Button onClick={handleGenerateShareLink} variant="default" className="gap-2" disabled={createShareLinkMutation.isPending || isLoading}>
                      <Sparkles className="w-4 h-4" />
                      {createShareLinkMutation.isPending ? "生成中..." : "生成分享链接"}
                    </Button>
                    <Button
                      onClick={() => {
                        setStudents([]);
                        setFilteredStudents([]);
                        localStorage.removeItem(STORAGE_KEY);
                        toast.success("数据已清空");
                      }}
                      variant="destructive"
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空数据
                    </Button>
                  </div>
                  
                  {showShareCode && shareCode && (
                    <Card className="p-4 mt-4 bg-green-50 border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3">分享链接已生成</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">分享码</p>
                          <div className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                            <p className="text-2xl font-bold text-green-600 font-mono">{shareCode}</p>
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(shareCode);
                                toast.success("分享码已复制");
                              }}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              复制
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">分享链接</p>
                          <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-200">
                            <p className="text-sm text-blue-600 font-mono flex-1 break-all">{window.location.origin}/parent?code={shareCode}</p>
                            <Button
                              onClick={() => {
                                const url = `${window.location.origin}/parent?code=${shareCode}`;
                                navigator.clipboard.writeText(url);
                                toast.success("链接已复制");
                              }}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              复制
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">将分享码或链接分享给家长，他们可以查看学生成绩</p>
                    </Card>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            <AnalysisPanel
              students={filteredStudents}
              analysisLevel={analysisLevel}
              setAnalysisLevel={setAnalysisLevel}
              analysisGrade={analysisGrade}
              setAnalysisGrade={setAnalysisGrade}
              analysisClass={analysisClass}
              setAnalysisClass={setAnalysisClass}
              showGenderCompare={showGenderCompare}
              setShowGenderCompare={setShowGenderCompare}
              grades={grades}
              classes={classes}
            />
          </TabsContent>

          {/* AI 建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            <AIAdvice students={students} />
          </TabsContent>

          {/* 教案生成标签页 */}
          <TabsContent value="lesson" className="space-y-4">
            <LessonPlanGenerator />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Data Management</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">View and manage all saved share links for student data.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">How to use share links:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Import student data in the Import/Query tab</li>
                    <li>Click Generate Share Link button to create a share code</li>
                    <li>Copy the share code and send to parents</li>
                    <li>Parents can enter the code in the Parent Portal to view scores</li>
                  </ol>
                </div>
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
function AnalysisPanel({
  students,
  analysisLevel,
  setAnalysisLevel,
  analysisGrade,
  setAnalysisGrade,
  analysisClass,
  setAnalysisClass,
  showGenderCompare,
  setShowGenderCompare,
  grades,
  classes,
}: {
  students: StudentRecord[];
  analysisLevel: "school" | "year" | "class";
  setAnalysisLevel: (level: "school" | "year" | "class") => void;
  analysisGrade: string;
  setAnalysisGrade: (grade: string) => void;
  analysisClass: string;
  setAnalysisClass: (cls: string) => void;
  showGenderCompare: boolean;
  setShowGenderCompare: (show: boolean) => void;
  grades: string[];
  classes: string[];
}) {
  const keyword = analysisLevel === 'year' ? analysisGrade : (analysisLevel === 'class' ? analysisClass : undefined);
  const analysis = performAnalysis(students, analysisLevel, keyword, showGenderCompare);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">数据分析</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">分析级别</label>
            <select
              value={analysisLevel}
              onChange={(e) => setAnalysisLevel(e.target.value as "school" | "year" | "class")}
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="school">全校</option>
              <option value="year">按年段</option>
              <option value="class">按班级</option>
            </select>
          </div>

          {analysisLevel === "year" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">选择年段</label>
              <select
                value={analysisGrade}
                onChange={(e) => setAnalysisGrade(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
              >
                <option value="">-- 选择年段 --</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {analysisLevel === "class" && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">选择班级</label>
              <select
                value={analysisClass}
                onChange={(e) => setAnalysisClass(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
              >
                <option value="">-- 选择班级 --</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGenderCompare}
                onChange={(e) => setShowGenderCompare(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">显示性别对比</span>
            </label>
          </div>
        </div>

        {/* 分析结果 */}
        {analysis && analysis.stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">总人数</p>
                <p className="text-2xl font-bold text-blue-600">{analysis.stats.count}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">平均成绩</p>
                <p className="text-2xl font-bold text-green-600">{analysis.stats.avgTotal}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">优秀率</p>
                <p className="text-2xl font-bold text-yellow-600">{analysis.stats.excellentRate}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">及格率</p>
                <p className="text-2xl font-bold text-red-600">{analysis.stats.passRate}</p>
              </div>
            </div>

            {showGenderCompare && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">性别统计</h3>
                  <p className="text-sm text-muted-foreground">性别统计功能正在开发中...</p>
                </Card>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
