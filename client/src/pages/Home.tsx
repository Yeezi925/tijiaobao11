import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Sparkles, Download, Trash2, Copy, Check } from "lucide-react";
import { StudentRecord } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tijiaobao_scores";

export default function Home() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("import");
  const [shareCode, setShareCode] = useState<string>("");
  const [shareLink, setShareLink] = useState("");
  const [showShareCode, setShowShareCode] = useState(false);
  const [expireOption, setExpireOption] = useState("7");
  const [copied, setCopied] = useState(false);

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  // 分析过滤器
  const [analysisLevel, setAnalysisLevel] = useState<"school" | "year" | "class">("school");
  const [analysisGrade, setAnalysisGrade] = useState("");
  const [analysisClass, setAnalysisClass] = useState("");

  // tRPC mutations
  const saveStudentMutation = trpc.teacher.saveStudentData.useMutation({
    onSuccess: () => {
      // 不显示单条成功提示，统一在函数中处理
    },
    onError: (error) => {
      console.error("[Save student error]", error);
    },
  });

  const createShareLinkMutation = trpc.teacher.createShareLink.useMutation({
    onSuccess: (result) => {
      if (result.success && result.shareCode) {
        setShareCode(result.shareCode);
        const baseUrl = window.location.origin;
        setShareLink(`${baseUrl}/parent?code=${result.shareCode}`);
        setShowShareCode(true);
        toast.success("分享链接生成成功！");
      } else {
        toast.error(result.error || "生成分享链接失败");
      }
    },
    onError: (error) => {
      console.error("[Create share link error]", error);
      toast.error("生成分享链接失败");
    },
  });

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
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
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
      toast.success("导出成功！文件已保存到下载文件夹");
    } catch (error) {
      toast.error("导出失败");
      console.error(error);
    }
  };

  // 保存到数据库
  const handleSaveToDatabase = async () => {
    if (students.length === 0) {
      toast.error("没有数据可保存");
      return;
    }

    setIsLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;
      
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
        } catch (error) {
          console.error(`保存 ${student.name} 失败:`, error);
          failCount++;
        }
      }
      
      if (failCount === 0) {
        toast.success(`已保存 ${successCount} 条学生记录到数据库`);
      } else {
        toast.warning(`保存完成: 成功 ${successCount} 条，失败 ${failCount} 条`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 生成分享链接 - 先保存学生数据，再生成分享链接
  const handleGenerateShareLink = async () => {
    if (students.length === 0) {
      toast.error("没有数据可分享");
      return;
    }

    setIsLoading(true);
    try {
      // 第一步：先保存所有学生数据到数据库，获得真实 ID
      const savedStudentIds: number[] = [];
      let saveFailCount = 0;
      
      for (const student of students) {
        try {
          const response = await saveStudentMutation.mutateAsync({
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
          
          // 从响应中提取学生 ID
          const responseData = response?.data as any;
          if (responseData && responseData.id) {
            savedStudentIds.push(responseData.id);
          }
        } catch (error) {
          console.error(`保存 ${student.name} 失败:`, error);
          saveFailCount++;
        }
      }
      
      if (saveFailCount > 0) {
        toast.warning(`有 ${saveFailCount} 条记录保存失败，将仅分享已保存的记录`);
      }
      
      if (savedStudentIds.length === 0) {
        toast.error("没有学生数据被保存，无法生成分享链接");
        return;
      }
      
      // 第二步：使用真实 ID 生成分享链接
      let expiresAt: Date | undefined;
      if (expireOption !== "never") {
        const days = parseInt(expireOption);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      await createShareLinkMutation.mutateAsync({
        title: "学生成绩分享",
        description: `分享 ${savedStudentIds.length} 名学生的成绩数据`,
        studentIds: savedStudentIds,
        expiresAt,
      });
    } catch (error) {
      console.error("生成分享码失败:", error);
      toast.error("生成分享码失败");
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
              <p className="text-sm text-gray-600 mt-1">教师系统 - 管理学生成绩、生成AI建议、教案管理</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              导入数据
            </TabsTrigger>
            <TabsTrigger value="query" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              查询分析
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI建议
            </TabsTrigger>
            <TabsTrigger value="lesson" className="gap-2">
              📚 教案
            </TabsTrigger>
          </TabsList>

          {/* 导入数据标签页 */}
          <TabsContent value="import" className="space-y-6">
            <Card className="p-8 border-2 border-dashed border-blue-300 bg-blue-50">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold mb-2">上传 Excel 文件</h3>
                <p className="text-gray-600 mb-4">支持 .xlsx, .xls, .csv 格式</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild disabled={isLoading} className="cursor-pointer">
                    <span>{isLoading ? "处理中..." : "选择文件"}</span>
                  </Button>
                </label>
              </div>
            </Card>

            {students.length > 0 && (
              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={handleSaveToDatabase} variant="default" className="gap-2" disabled={saveStudentMutation.isPending || isLoading}>
                    💾 保存到数据库
                  </Button>
                  <Button onClick={handleExport} variant="outline" className="gap-2" disabled={isLoading}>
                    <Download className="w-4 h-4" />
                    导出 Excel
                  </Button>
                  <Button onClick={() => { setStudents([]); setFilteredStudents([]); localStorage.removeItem(STORAGE_KEY); }} variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    清空数据
                  </Button>
                </div>

                {/* 分享链接生成 */}
                <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <h3 className="font-semibold mb-4 text-green-900">生成分享链接</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">分享链接有效期</label>
                      <select
                        value={expireOption}
                        onChange={(e) => setExpireOption(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="7">7 天</option>
                        <option value="30">30 天</option>
                        <option value="90">90 天</option>
                        <option value="never">永久有效</option>
                      </select>
                    </div>

                    <Button onClick={handleGenerateShareLink} variant="default" className="gap-2 w-full" disabled={createShareLinkMutation.isPending || isLoading}>
                      🔗 生成分享链接
                    </Button>

                    {showShareCode && (
                      <div className="bg-white p-4 rounded-lg border border-green-300 space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">分享码</p>
                          <div className="flex gap-2">
                            <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm font-bold text-center">{shareCode}</code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(shareCode);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-2">分享链接</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={shareLink}
                              readOnly
                              className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(shareLink);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          {expireOption === "never"
                            ? "此链接永久有效"
                            : `此链接将在 ${expireOption} 天后过期`}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 数据统计 */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">数据统计</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">总学生数</p>
                      <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">年段数</p>
                      <p className="text-2xl font-bold text-green-600">{grades.length}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* 查询分析标签页 */}
          <TabsContent value="query" className="space-y-6">
            {students.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                <p>请先导入数据</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">查询过滤</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">查询类型</label>
                      <select
                        value={queryType}
                        onChange={(e) => setQueryType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="all">全部</option>
                        <option value="grade">按年段</option>
                        <option value="class">按班级</option>
                        <option value="name">按姓名</option>
                      </select>
                    </div>

                    {queryType === "grade" && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">选择年段</label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => setSelectedGrade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">全部年段</option>
                          {grades.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {queryType === "class" && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">选择班级</label>
                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">全部班级</option>
                          {classes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {queryType === "name" && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">输入姓名</label>
                        <Input
                          type="text"
                          placeholder="输入学生姓名"
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* 查询结果表格 */}
                <Card className="p-6 overflow-x-auto">
                  <h3 className="font-semibold mb-4">查询结果</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">姓名</th>
                        <th className="px-4 py-2 text-left">年段</th>
                        <th className="px-4 py-2 text-left">班级</th>
                        <th className="px-4 py-2 text-center">总分40</th>
                        <th className="px-4 py-2 text-center">长跑/游泳</th>
                        <th className="px-4 py-2 text-center">球类</th>
                        <th className="px-4 py-2 text-center">选考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{s.name}</td>
                          <td className="px-4 py-2">{s.grade || "-"}</td>
                          <td className="px-4 py-2">{s.class || "-"}</td>
                          <td className="px-4 py-2 text-center font-semibold">{s.total40 || "-"}</td>
                          <td className="px-4 py-2 text-center">{s.longContrib || "-"}</td>
                          <td className="px-4 py-2 text-center">{s.ballContrib || "-"}</td>
                          <td className="px-4 py-2 text-center">{s.selectContrib || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* AI建议标签页 */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="p-8 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <p>AI建议功能开发中...</p>
            </Card>
          </TabsContent>

          {/* 教案标签页 */}
          <TabsContent value="lesson" className="space-y-6">
            <Card className="p-8 text-center text-gray-500">
              <p>教案管理功能开发中...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
