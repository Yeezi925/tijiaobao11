import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Trash2, BarChart3, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import AIAdvice from "./AIAdvice";
import LessonPlanGenerator from "./LessonPlanGenerator";
import { StudentRecord } from "@/lib/scoring";

const STORAGE_KEY = "tijiaobao_scores";

export default function Teacher() {
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [activeTab, setActiveTab] = useState("import");
  
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
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userInfo);
      if (user.userType !== "teacher") {
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("解析用户信息失败:", error);
      window.location.href = "/login";
      return;
    }

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

    setIsReady(true);
  }, []);

  // 处理查询过滤
  useEffect(() => {
    let filtered = students;

    if (queryType === "grade" && selectedGrade) {
      filtered = filtered.filter((s) => s.grade?.includes(selectedGrade));
    } else if (queryType === "class" && selectedClass) {
      filtered = filtered.filter((s) => s.class === selectedClass);
    } else if (queryType === "name" && searchName) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [queryType, selectedGrade, selectedClass, searchName, students]);

  // 处理分析
  useEffect(() => {
    if (activeTab === "analysis" && students.length > 0) {
      let keyword = "";
      if (analysisLevel === "year" && analysisGrade) {
        keyword = analysisGrade;
      } else if (analysisLevel === "class" && analysisClass) {
        keyword = analysisClass;
      }

      const result = performAnalysis(students, analysisLevel, keyword, showGenderCompare);
      setAnalysisResult(result);
    }
  }, [activeTab, analysisLevel, analysisGrade, analysisClass, showGenderCompare, students]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as StudentRecord[];

      if (jsonData.length === 0) {
        toast.error("Excel 文件为空");
        return;
      }

      setStudents(jsonData);
      setFilteredStudents(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData));
      toast.success(`成功导入 ${jsonData.length} 条学生记录`);
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error("没有数据可导出");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "学生成绩");
    XLSX.writeFile(workbook, "学生成绩.xlsx");
    toast.success("导出成功");
  };

  const handleClearData = () => {
    if (confirm("确定要清空所有数据吗？")) {
      setStudents([]);
      setFilteredStudents([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("数据已清空");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  if (!isReady) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  const uniqueGrades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - 教师系统</h1>
            <p className="text-muted-foreground">现代化体育成绩管理系统</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="import">📥 导入</TabsTrigger>
            <TabsTrigger value="query">📋 查询</TabsTrigger>
            <TabsTrigger value="analysis">📊 分析</TabsTrigger>
            <TabsTrigger value="ai">✨ AI建议</TabsTrigger>
            <TabsTrigger value="lesson">📝 教案</TabsTrigger>
            <TabsTrigger value="stats">📈 统计</TabsTrigger>
          </TabsList>

          {/* 导入标签页 */}
          <TabsContent value="import" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">导入 Excel 文件</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground mb-4">
                  支持 .xlsx, .xls, .csv 格式，请确保 Excel 包含以下列：姓名、班级、年段、性别、各项成绩
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>选择文件上传</Button>
              </div>

              {students.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">已导入 {students.length} 条学生记录</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportExcel} className="flex-1">
                      <Download className="mr-2" size={16} />
                      导出 Excel
                    </Button>
                    <Button variant="destructive" onClick={handleClearData} className="flex-1">
                      <Trash2 className="mr-2" size={16} />
                      清空数据
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">查询学生成绩</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">查询类型</label>
                    <select
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
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
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择年段 --</option>
                        {uniqueGrades.map((g: any) => (
                          <option key={g} value={g}>
                            {g}
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
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择班级 --</option>
                        {uniqueClasses.map((c: any) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {queryType === "name" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">输入姓名</label>
                      <Input
                        type="text"
                        placeholder="请输入学生姓名"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left">姓名</th>
                        <th className="px-4 py-2 text-left">年段</th>
                        <th className="px-4 py-2 text-left">班级</th>
                        <th className="px-4 py-2 text-left">性别</th>
                        <th className="px-4 py-2 text-center">成绩</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr key={index} className="border-b hover:bg-secondary/50">
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2">{student.grade}</td>
                          <td className="px-4 py-2">{student.class}</td>
                          <td className="px-4 py-2">{student.gender}</td>
                          <td className="px-4 py-2 text-center font-bold text-green-600">
                            {student.total40 || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">数据分析</h2>
                
                {/* 分析选项 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">分析级别</label>
                    <select
                      value={analysisLevel}
                      onChange={(e) => setAnalysisLevel(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
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
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择年段 --</option>
                        {uniqueGrades.map((g: any) => (
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
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择班级 --</option>
                        {uniqueClasses.map((c: any) => (
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
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">男女对比</span>
                    </label>
                  </div>
                </div>

                {/* 统计数据展示 */}
                {analysisResult && (
                  <div className="space-y-6">
                    {/* 基础统计 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-blue-50">
                        <p className="text-sm text-muted-foreground">学生总数</p>
                        <p className="text-2xl font-bold text-blue-600">{analysisResult.stats?.count || 0}</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <p className="text-sm text-muted-foreground">平均成绩</p>
                        <p className="text-2xl font-bold text-green-600">{analysisResult.stats?.average || "0.00"}</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <p className="text-sm text-muted-foreground">最高成绩</p>
                        <p className="text-2xl font-bold text-purple-600">{analysisResult.stats?.max || "0.00"}</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <p className="text-sm text-muted-foreground">最低成绩</p>
                        <p className="text-2xl font-bold text-orange-600">{analysisResult.stats?.min || "0.00"}</p>
                      </Card>
                    </div>

                    {/* 男女对比 */}
                    {showGenderCompare && analysisResult.maleStats && analysisResult.femaleStats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 bg-blue-50">
                          <p className="text-lg font-bold mb-3">男生统计</p>
                          <div className="space-y-2 text-sm">
                            <p>人数: {analysisResult.maleStats.count}</p>
                            <p>平均: {analysisResult.maleStats.average}</p>
                            <p>最高: {analysisResult.maleStats.max}</p>
                            <p>最低: {analysisResult.maleStats.min}</p>
                          </div>
                        </Card>
                        <Card className="p-4 bg-pink-50">
                          <p className="text-lg font-bold mb-3">女生统计</p>
                          <div className="space-y-2 text-sm">
                            <p>人数: {analysisResult.femaleStats.count}</p>
                            <p>平均: {analysisResult.femaleStats.average}</p>
                            <p>最高: {analysisResult.femaleStats.max}</p>
                            <p>最低: {analysisResult.femaleStats.min}</p>
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* 项目统计 */}
                    {analysisResult.projectStats && (
                      <Card className="p-4">
                        <p className="text-lg font-bold mb-3">项目统计</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-blue-50 rounded">
                            <p className="text-sm text-muted-foreground">长跑/游泳</p>
                            <p className="text-lg font-bold">{analysisResult.projectStats.longrun.avg}</p>
                            <p className="text-xs text-muted-foreground">{analysisResult.projectStats.longrun.count} 人</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded">
                            <p className="text-sm text-muted-foreground">球类项目</p>
                            <p className="text-lg font-bold">{analysisResult.projectStats.ball.avg}</p>
                            <p className="text-xs text-muted-foreground">{analysisResult.projectStats.ball.count} 人</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded">
                            <p className="text-sm text-muted-foreground">选考项目</p>
                            <p className="text-lg font-bold">{analysisResult.projectStats.select.avg}</p>
                            <p className="text-xs text-muted-foreground">{analysisResult.projectStats.select.count} 人</p>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* 单项统计 */}
                    {analysisResult.singleItemStats && Object.keys(analysisResult.singleItemStats).length > 0 && (
                      <Card className="p-4">
                        <p className="text-lg font-bold mb-3">单项成绩统计</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Object.entries(analysisResult.singleItemStats).map(([name, data]: any) => (
                            <div key={name} className="p-3 bg-gray-50 rounded">
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-lg font-bold text-primary">{data.avg}</p>
                              <p className="text-xs text-muted-foreground">{data.count} 人参加</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>

          {/* AI建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            {students.length > 0 ? (
              <AIAdvice students={students as any} />
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>

          {/* 教案标签页 */}
          <TabsContent value="lesson" className="space-y-4">
            <LessonPlanGenerator />
          </TabsContent>

          {/* 统计标签页 */}
          <TabsContent value="stats" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">快速统计</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-50">
                    <p className="text-sm text-muted-foreground">学生总数</p>
                    <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <p className="text-sm text-muted-foreground">平均成绩</p>
                    <p className="text-2xl font-bold text-green-600">
                      {students.length > 0
                        ? (
                            students.reduce(
                              (sum, s) => sum + (parseFloat(s.total40 || "0") || 0),
                              0
                            ) / students.length
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <p className="text-sm text-muted-foreground">最高成绩</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {students.length > 0
                        ? Math.max(
                            ...students.map((s) => parseFloat(s.total40 || "0") || 0)
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-orange-50">
                    <p className="text-sm text-muted-foreground">最低成绩</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {students.length > 0
                        ? Math.min(
                            ...students.map((s) => parseFloat(s.total40 || "0") || 0)
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
