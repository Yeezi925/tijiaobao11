import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentRecord } from "@/lib/scoring";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";

const STORAGE_KEY = "tijiaobao_scores";

// 临时占位组件
function AIAdvice() {
  return <div className="p-4 text-muted-foreground">AI 建议功能开发中...</div>;
}

export default function Parent() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [activeTab, setActiveTab] = useState("query");

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  // 分析过滤器
  const [analysisLevel, setAnalysisLevel] = useState<"school" | "year" | "class">("school");
  const [analysisGrade, setAnalysisGrade] = useState("");
  const [analysisClass, setAnalysisClass] = useState("");

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

  // 处理查询过滤
  const handleQuery = () => {
    let result = students;

    if (queryType === "grade" && selectedGrade) {
      result = result.filter((s) => s.grade === selectedGrade);
    } else if (queryType === "class" && selectedClass) {
      result = result.filter((s) => s.class === selectedClass);
    } else if (queryType === "name" && searchName) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(result);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">体教宝</h1>
            <p className="text-sm text-muted-foreground">家长端 - 查看孩子成绩</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="query">查询</TabsTrigger>
            <TabsTrigger value="ai">AI 建议</TabsTrigger>
          </TabsList>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">学生成绩查询</h2>

              <div className="space-y-4">
                {/* 查询类型选择 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">查询方式</label>
                    <select
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="all">全部学生</option>
                      <option value="grade">按年段</option>
                      <option value="class">按班级</option>
                      <option value="name">按姓名</option>
                    </select>
                  </div>

                  {queryType === "grade" && (
                    <div>
                      <label className="text-sm font-medium">选择年段</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
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

                  {queryType === "class" && (
                    <div>
                      <label className="text-sm font-medium">选择班级</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
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

                  {queryType === "name" && (
                    <div>
                      <label className="text-sm font-medium">输入姓名</label>
                      <Input
                        type="text"
                        placeholder="输入学生姓名"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div className="flex items-end">
                    <Button onClick={handleQuery} className="w-full">
                      查询
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* 查询结果表格 */}
            {filteredStudents.length > 0 ? (
              <Card className="p-6 overflow-x-auto">
                <h3 className="text-lg font-bold mb-4">查询结果 ({filteredStudents.length} 人)</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-2">姓名</th>
                      <th className="text-left py-2 px-2">班级</th>
                      <th className="text-left py-2 px-2">性别</th>
                      <th className="text-left py-2 px-2">成绩</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-gray-50">
                        <td className="py-2 px-2">{student.name}</td>
                        <td className="py-2 px-2">{student.class}</td>
                        <td className="py-2 px-2">{student.gender}</td>
                        <td className="py-2 px-2">{student.total40}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                暂无数据
              </Card>
            )}
          </TabsContent>

          {/* AI 建议标签页 */}
          <TabsContent value="ai">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">AI 训练建议</h2>
              <AIAdvice />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
