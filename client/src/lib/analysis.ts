/**
 * 分析与统计功能库
 * 支持多层级数据分析（学校、年段、班级）
 */

import { StudentRecord, calculateStatistics, StatisticsResult } from "./scoring";

export interface AnalysisResult {
  level: "school" | "year" | "class" | "individual";
  keyword?: string;
  stats: StatisticsResult | null;
  maleStats?: StatisticsResult | null;
  femaleStats?: StatisticsResult | null;
  singleItemStats?: SingleItemStats;
}

export interface SingleItemStats {
  "长跑": { count: number; avg: string };
  "游泳": { count: number; avg: string };
  "足球": { count: number; avg: string };
  "篮球": { count: number; avg: string };
  "排球": { count: number; avg: string };
  "50米跑": { count: number; avg: string };
  "仰卧起坐": { count: number; avg: string };
  "实心球": { count: number; avg: string };
  "跳绳": { count: number; avg: string };
  "引体类": { count: number; avg: string };
  "立定跳远": { count: number; avg: string };
}

/**
 * 执行分析
 */
export function performAnalysis(
  students: StudentRecord[],
  level: "school" | "year" | "class" | "individual",
  keyword?: string,
  showGenderCompare: boolean = false
): AnalysisResult {
  let filtered = students;

  // 按级别筛选
  if (level === "year" && keyword) {
    filtered = students.filter((s) => s.grade?.toLowerCase() === keyword.toLowerCase());
  } else if (level === "class" && keyword) {
    filtered = students.filter((s) => s.class?.toLowerCase() === keyword.toLowerCase());
  }

  // 计算统计数据
  const stats = calculateStatistics(filtered);
  let maleStats: StatisticsResult | null = null;
  let femaleStats: StatisticsResult | null = null;

  if (showGenderCompare) {
    maleStats = calculateStatistics(filtered.filter((s) => s.gender === "男"));
    femaleStats = calculateStatistics(filtered.filter((s) => s.gender === "女"));
  }

  // 计算单项统计
  const singleItemStats = calculateSingleItemStats(filtered);

  return {
    level,
    keyword,
    stats,
    maleStats,
    femaleStats,
    singleItemStats
  };
}

/**
 * 计算单项运动的统计数据
 */
function calculateSingleItemStats(students: StudentRecord[]): SingleItemStats {
  const stats: SingleItemStats = {
    "长跑": { count: 0, avg: "0" },
    "游泳": { count: 0, avg: "0" },
    "足球": { count: 0, avg: "0" },
    "篮球": { count: 0, avg: "0" },
    "排球": { count: 0, avg: "0" },
    "50米跑": { count: 0, avg: "0" },
    "仰卧起坐": { count: 0, avg: "0" },
    "实心球": { count: 0, avg: "0" },
    "跳绳": { count: 0, avg: "0" },
    "引体类": { count: 0, avg: "0" },
    "立定跳远": { count: 0, avg: "0" }
  };

  // 长跑/游泳
  const longrunStudents = students.filter((s) => s.longrun && s.longrun > 0);
  const swimStudents = students.filter((s) => s.swim && s.swim > 0);
  if (longrunStudents.length > 0) {
    const avg = longrunStudents.reduce((sum, s) => sum + (s.longrun || 0), 0) / longrunStudents.length;
    stats["长跑"] = { count: longrunStudents.length, avg: avg.toFixed(1) };
  }
  if (swimStudents.length > 0) {
    const avg = swimStudents.reduce((sum, s) => sum + (s.swim || 0), 0) / swimStudents.length;
    stats["游泳"] = { count: swimStudents.length, avg: avg.toFixed(1) };
  }

  // 球类
  const footballStudents = students.filter((s) => s.football && s.football > 0);
  const basketballStudents = students.filter((s) => s.basketball && s.basketball > 0);
  const volleyballStudents = students.filter((s) => s.volleyball && s.volleyball > 0);
  if (footballStudents.length > 0) {
    const avg = footballStudents.reduce((sum, s) => sum + (s.football || 0), 0) / footballStudents.length;
    stats["足球"] = { count: footballStudents.length, avg: avg.toFixed(1) };
  }
  if (basketballStudents.length > 0) {
    const avg = basketballStudents.reduce((sum, s) => sum + (s.basketball || 0), 0) / basketballStudents.length;
    stats["篮球"] = { count: basketballStudents.length, avg: avg.toFixed(1) };
  }
  if (volleyballStudents.length > 0) {
    const avg = volleyballStudents.reduce((sum, s) => sum + (s.volleyball || 0), 0) / volleyballStudents.length;
    stats["排球"] = { count: volleyballStudents.length, avg: avg.toFixed(1) };
  }

  // 选考项目
  const run50Students = students.filter((s) => s.run50 && s.run50 > 0);
  const situpStudents = students.filter((s) => s.situp && s.situp > 0);
  const ballStudents = students.filter((s) => s.ball && s.ball > 0);
  const ropeStudents = students.filter((s) => s.rope && s.rope > 0);
  const pullupStudents = students.filter((s) => s.pullup && s.pullup > 0);
  const jumpStudents = students.filter((s) => s.jump && s.jump > 0);

  if (run50Students.length > 0) {
    const avg = run50Students.reduce((sum, s) => sum + (s.run50 || 0), 0) / run50Students.length;
    stats["50米跑"] = { count: run50Students.length, avg: avg.toFixed(1) };
  }
  if (situpStudents.length > 0) {
    const avg = situpStudents.reduce((sum, s) => sum + (s.situp || 0), 0) / situpStudents.length;
    stats["仰卧起坐"] = { count: situpStudents.length, avg: avg.toFixed(1) };
  }
  if (ballStudents.length > 0) {
    const avg = ballStudents.reduce((sum, s) => sum + (s.ball || 0), 0) / ballStudents.length;
    stats["实心球"] = { count: ballStudents.length, avg: avg.toFixed(1) };
  }
  if (ropeStudents.length > 0) {
    const avg = ropeStudents.reduce((sum, s) => sum + (s.rope || 0), 0) / ropeStudents.length;
    stats["跳绳"] = { count: ropeStudents.length, avg: avg.toFixed(1) };
  }
  if (pullupStudents.length > 0) {
    const avg = pullupStudents.reduce((sum, s) => sum + (s.pullup || 0), 0) / pullupStudents.length;
    stats["引体类"] = { count: pullupStudents.length, avg: avg.toFixed(1) };
  }
  if (jumpStudents.length > 0) {
    const avg = jumpStudents.reduce((sum, s) => sum + (s.jump || 0), 0) / jumpStudents.length;
    stats["立定跳远"] = { count: jumpStudents.length, avg: avg.toFixed(1) };
  }

  return stats;
}

/**
 * 获取所有唯一的年段
 */
export function getUniqueGrades(students: StudentRecord[]): string[] {
  const grades = new Set(students.map((s) => s.grade).filter((g): g is string => Boolean(g)));
  return Array.from(grades).sort();
}

/**
 * 获取所有唯一的班级
 */
export function getUniqueClasses(students: StudentRecord[]): string[] {
  const classes = new Set(students.map((s) => s.class).filter((c): c is string => Boolean(c)));
  return Array.from(classes).sort();
}

/**
 * 获取所有唯一的学校
 */
export function getUniqueSchools(students: StudentRecord[]): string[] {
  const schools = new Set(students.map((s) => s.school).filter((s): s is string => Boolean(s)));
  return Array.from(schools).sort();
}
