/**
 * 体教宝 - 体育成绩评分与换算逻辑
 * 
 * 核心功能：
 * - 评分标准：包含 12 个运动项目的完整评分表（男女性别区分）
 * - 成绩换算：长跑/游泳（15分）+ 球类（9分）+ 选考两项（各8分）= 40分制
 * - 数据处理：学生信息解析、成绩计算、统计分析
 */

export interface ScoringTable {
  [key: string]: {
    [gender: string]: {
      [score: number]: number;
    };
  };
}

export interface StudentRecord {
  name: string;
  grade?: string;
  class?: string;
  school?: string;
  gender: "男" | "女";
  
  // 长跑/游泳
  longrun?: number;
  swim?: number;
  long100?: number;
  longContrib?: string;
  
  // 球类
  football?: number;
  basketball?: number;
  volleyball?: number;
  ballContrib?: string;
  
  // 选考项目
  run50?: number;
  situp?: number;
  ball?: number;
  rope?: number;
  pullup?: number;
  jump?: number;
  selectContrib?: string;
  selectedProjects?: Array<{ name: string; contrib: string }>;
  
  // 计算结果
  total40?: string;
  status?: string;
}

// 完整的评分标准表
export const SCORING: ScoringTable = {
  "1000米跑": {
    "男": {
      100: 340, 98: 342, 96: 344, 94: 346, 92: 348, 90: 350, 88: 353, 86: 356,
      84: 359, 82: 402, 80: 405, 78: 410, 76: 415, 74: 420, 72: 425, 70: 430,
      68: 435, 66: 440, 64: 445, 62: 450, 60: 455, 50: 515, 40: 535, 30: 555,
      20: 615, 10: 635
    }
  },
  "800米跑": {
    "女": {
      100: 325, 98: 327, 96: 330, 94: 333, 92: 336, 90: 339, 88: 342, 86: 345,
      84: 348, 82: 351, 80: 355, 78: 400, 76: 405, 74: 410, 72: 415, 70: 420,
      68: 425, 66: 430, 64: 435, 62: 440, 60: 445, 50: 455, 40: 505, 30: 515,
      20: 525, 10: 535
    }
  },
  "游泳": {
    "男": {
      100: 448, 98: 450, 96: 453, 94: 456, 92: 459, 90: 502, 88: 505, 86: 508,
      84: 511, 82: 514, 80: 517, 78: 523, 76: 529, 74: 535, 72: 541, 70: 547,
      68: 553, 66: 559, 64: 605, 62: 611, 60: 617, 50: 629, 40: 641, 30: 653,
      20: 665, 10: 717
    },
    "女": {
      100: 508, 98: 510, 96: 513, 94: 516, 92: 519, 90: 522, 88: 525, 86: 528,
      84: 531, 82: 534, 80: 537, 78: 543, 76: 549, 74: 555, 72: 601, 70: 607,
      68: 613, 66: 619, 64: 625, 62: 631, 60: 637, 50: 649, 40: 701, 30: 713,
      20: 725, 10: 737
    }
  },
  "50米跑": {
    "男": {
      100: 7.3, 96: 7.4, 90: 7.5, 86: 7.6, 80: 7.7, 78: 7.9, 76: 8.1, 74: 8.3,
      72: 8.5, 70: 8.7, 68: 8.9, 66: 9.1, 64: 9.3, 62: 9.5, 60: 9.7, 50: 9.9,
      40: 10.1, 30: 10.3, 20: 10.5, 10: 10.7
    },
    "女": {
      100: 7.9, 96: 8.0, 90: 8.1, 88: 8.2, 86: 8.3, 84: 8.4, 82: 8.5, 80: 8.7,
      78: 8.9, 76: 9.1, 74: 9.3, 72: 9.5, 70: 9.7, 68: 9.9, 66: 10.1, 64: 10.3,
      62: 10.5, 60: 10.7, 50: 10.9, 40: 11.1, 30: 11.3, 20: 11.5, 10: 11.7
    }
  },
  "立定跳远": {
    "男": {
      100: 250, 98: 248, 96: 246, 94: 244, 92: 242, 90: 240, 88: 237, 86: 234,
      84: 231, 82: 228, 80: 225, 78: 221, 76: 217, 74: 213, 72: 209, 70: 205,
      68: 201, 66: 197, 64: 193, 62: 189, 60: 185, 50: 180, 40: 175, 30: 170,
      20: 165, 10: 160
    },
    "女": {
      100: 202, 98: 200, 96: 198, 94: 196, 92: 194, 90: 191, 88: 188, 86: 185,
      84: 182, 82: 179, 80: 176, 78: 173, 76: 170, 74: 167, 72: 164, 70: 161,
      68: 158, 66: 155, 64: 152, 62: 149, 60: 146, 50: 141, 40: 136, 30: 131,
      20: 126, 10: 121
    }
  },
  "引体向上": {
    "男": {
      100: 12, 96: 11, 92: 10, 88: 9, 84: 8, 78: 7, 72: 6, 66: 5, 60: 4, 50: 3,
      40: 2, 30: 1
    }
  },
  "斜身引体": {
    "女": {
      100: 42, 98: 41, 96: 40, 94: 39, 92: 38, 90: 37, 88: 36, 86: 35, 84: 34,
      82: 33, 80: 32, 78: 30, 76: 28, 74: 26, 72: 24, 70: 22, 68: 20, 66: 18,
      64: 16, 62: 14, 60: 12, 50: 10, 40: 8, 30: 6, 20: 4, 10: 2
    }
  },
  "一分钟仰卧起坐": {
    "男": {
      100: 54, 98: 53, 96: 52, 94: 51, 92: 50, 90: 49, 88: 48, 86: 47, 84: 46,
      82: 45, 80: 44, 78: 42, 76: 40, 74: 38, 72: 36, 70: 34, 68: 32, 66: 30,
      64: 28, 62: 26, 60: 24, 50: 22, 40: 20, 30: 18, 20: 16, 10: 14
    },
    "女": {
      100: 52, 98: 51, 96: 50, 94: 49, 92: 48, 90: 47, 88: 46, 86: 45, 84: 44,
      82: 43, 80: 42, 78: 40, 76: 38, 74: 36, 72: 34, 70: 32, 68: 30, 66: 28,
      64: 26, 62: 24, 60: 22, 50: 20, 40: 18, 30: 16, 20: 14, 10: 12
    }
  },
  "1分钟跳绳": {
    "男": {
      100: 175, 98: 172, 96: 169, 94: 166, 92: 163, 90: 160, 88: 157, 86: 154,
      84: 151, 82: 148, 80: 145, 78: 138, 76: 131, 74: 124, 72: 117, 70: 110,
      68: 103, 66: 96, 64: 89, 62: 75, 60: 60, 50: 50, 40: 40, 30: 30, 20: 20,
      10: 10
    },
    "女": {
      100: 170, 98: 167, 96: 164, 94: 161, 92: 158, 90: 155, 88: 152, 86: 149,
      84: 146, 82: 143, 80: 140, 78: 133, 76: 126, 74: 119, 72: 112, 70: 105,
      68: 98, 66: 91, 64: 84, 62: 77, 60: 70, 50: 67, 40: 64, 30: 61, 20: 58,
      10: 55
    }
  },
  "掷实心球": {
    "男": {
      100: 11, 98: 10.8, 96: 10.6, 94: 10.4, 92: 10.2, 90: 10, 88: 9.7, 86: 9.4,
      84: 9.1, 82: 8.8, 80: 8.5, 78: 8.2, 76: 7.9, 74: 7.6, 72: 7.3, 70: 7,
      68: 6.7, 66: 6.4, 64: 6.1, 62: 5.8, 60: 5.5, 50: 5.1, 40: 4.7, 30: 4.3,
      20: 3.9, 10: 3.5
    },
    "女": {
      100: 7.7, 98: 7.6, 96: 7.5, 94: 7.4, 92: 7.3, 90: 7.2, 88: 7.1, 86: 7,
      84: 6.9, 82: 6.8, 80: 6.7, 78: 6.5, 76: 6.3, 74: 6.1, 72: 5.9, 70: 5.7,
      68: 5.5, 66: 5.3, 64: 5.1, 62: 4.9, 60: 4.7, 50: 4.3, 40: 3.9, 30: 3.5,
      20: 3.1, 10: 2.7
    }
  },
  "足球运球": {
    "男": {
      100: 9.3, 98: 9.4, 96: 9.5, 94: 9.6, 92: 9.7, 90: 9.8, 88: 10, 86: 10.2,
      84: 10.4, 82: 10.6, 80: 10.8, 78: 11, 76: 11.2, 74: 11.4, 72: 11.6, 70: 11.8,
      68: 12, 66: 12.2, 64: 12.4, 62: 12.6, 60: 12.8, 50: 13.8, 40: 14.8, 30: 15.8,
      20: 16.8, 10: 17.8
    },
    "女": {
      100: 12.3, 98: 12.4, 96: 12.5, 94: 12.6, 92: 12.7, 90: 12.8, 88: 13, 86: 13.2,
      84: 13.4, 82: 13.6, 80: 13.8, 78: 14, 76: 14.2, 74: 14.4, 72: 14.6, 70: 14.8,
      68: 15, 66: 15.2, 64: 15.4, 62: 15.6, 60: 15.8, 50: 16.8, 40: 17.8, 30: 18.8,
      20: 19.8, 10: 20.8
    }
  },
  "篮球运球": {
    "男": {
      100: 13.2, 98: 13.3, 96: 13.4, 94: 13.5, 92: 13.6, 90: 13.7, 88: 13.9, 86: 14.1,
      84: 14.3, 82: 14.5, 80: 14.7, 78: 15, 76: 15.3, 74: 15.6, 72: 15.9, 70: 16.2,
      68: 16.5, 66: 16.8, 64: 17.1, 62: 17.4, 60: 17.7, 50: 18.7, 40: 19.7, 30: 20.7,
      20: 21.7, 10: 22.7
    },
    "女": {
      100: 15.5, 98: 15.6, 96: 15.7, 94: 15.8, 92: 15.9, 90: 16, 88: 16.2, 86: 16.4,
      84: 16.6, 82: 16.8, 80: 17, 78: 17.3, 76: 17.6, 74: 17.9, 72: 18.2, 70: 18.5,
      68: 18.8, 66: 19.1, 64: 19.4, 62: 19.7, 60: 20, 50: 21, 40: 22, 30: 23, 20: 24,
      10: 25
    }
  },
  "排球40秒对墙垫球": {
    "男": {
      100: 33, 98: 32, 96: 31, 94: 30, 92: 29, 90: 28, 88: 27, 86: 26, 84: 25,
      82: 24, 80: 23, 78: 22, 76: 21, 74: 20, 72: 19, 70: 18, 68: 17, 66: 16,
      64: 15, 62: 13, 60: 11, 50: 9, 40: 7, 30: 5, 20: 3, 10: 1
    },
    "女": {
      100: 30, 98: 29, 96: 28, 94: 27, 92: 26, 90: 25, 88: 24, 86: 23, 84: 22,
      82: 21, 80: 20, 78: 19, 76: 18, 74: 17, 72: 16, 70: 15, 68: 14, 66: 13,
      64: 12, 62: 10, 60: 8, 50: 6, 40: 4, 30: 2, 20: 1, 10: 0
    }
  }
};

/**
 * 根据成绩查找对应的分数
 * @param table 评分表
 * @param value 成绩值
 * @param smallerBetter 是否越小越好（如跑步时间）
 * @returns 对应的分数（0-100）
 */
export function findScore(table: { [key: number]: number }, value: number, smallerBetter: boolean = true): number {
  let best = 10;
  for (const [scoreStr, threshold] of Object.entries(table)) {
    const score = Number(scoreStr);
    if ((smallerBetter && value <= threshold) || (!smallerBetter && value >= threshold)) {
      if (score > best) best = score;
    }
  }
  return best;
}

/**
 * 计算学生的完整成绩
 * @param record 学生记录
 */
export function calculateScores(record: StudentRecord): void {
  const gender = record.gender;
  const longValue = record.swim || record.longrun || 0;
  const isSwim = !!record.swim;

  // 长跑/游泳（15分）
  let long100 = 0;
  if (longValue > 0) {
    const project = isSwim ? "游泳" : gender === "男" ? "1000米跑" : "800米跑";
    const table = SCORING[project][gender];
    long100 = findScore(table, longValue, true);
  }
  record.long100 = long100;
  record.longContrib = ((long100 / 100) * 15).toFixed(1);

  // 球类（9分）
  let ball100 = 0;
  if (record.football && record.football > 0) {
    ball100 = findScore(SCORING["足球运球"][gender], record.football, true);
  } else if (record.basketball && record.basketball > 0) {
    ball100 = findScore(SCORING["篮球运球"][gender], record.basketball, true);
  } else if (record.volleyball && record.volleyball > 0) {
    ball100 = findScore(SCORING["排球40秒对墙垫球"][gender], record.volleyball, false);
  }
  const ballContrib = (ball100 / 100) * 9;
  record.ballContrib = ballContrib.toFixed(1);

  // 选考项目（两项，各8分）
  let selectContrib = 0;
  const selectedProjects: Array<{ name: string; contrib: string }> = [];
  const selectItems = [
    { val: record.run50, project: "50米跑", smaller: true },
    { val: record.situp, project: "一分钟仰卧起坐", smaller: false },
    { val: record.ball, project: "掷实心球", smaller: false },
    { val: record.rope, project: "1分钟跳绳", smaller: false },
    { val: record.pullup, project: gender === "男" ? "引体向上" : "斜身引体", smaller: false },
    { val: record.jump, project: "立定跳远", smaller: false }
  ];

  const validSelect = selectItems
    .filter((item) => item.val && item.val > 0)
    .map((item) => ({
      ...item,
      score: findScore(SCORING[item.project][gender], item.val!, item.smaller)
    }))
    .sort((a, b) => b.score - a.score);

  validSelect.slice(0, 2).forEach((item) => {
    const contrib = (item.score / 100) * 8;
    selectContrib += contrib;
    selectedProjects.push({ name: item.project, contrib: contrib.toFixed(1) });
  });

  record.selectContrib = selectContrib.toFixed(1);
  record.selectedProjects = selectedProjects;

  // 总分（40分制）
  record.total40 = (parseFloat(record.longContrib) + parseFloat(record.ballContrib) + selectContrib).toFixed(1);
  record.status = "已计算";
}

/**
 * 计算统计数据
 */
export interface StatisticsResult {
  count: number;
  avgTotal: string;
  excellentRate: string;
  passRate: string;
  lowRate: string;
  fullScoreCount: number;
  avgLong: string;
  avgBall: string;
  avgSelect: string;
}

export function calculateStatistics(group: StudentRecord[]): StatisticsResult | null {
  if (!group || group.length === 0) return null;

  const totals = group.map((s) => parseFloat(s.total40 || "0") || 0);
  const avgTotal = (totals.reduce((a, b) => a + b, 0) / group.length).toFixed(1);
  const excellentRate = (((totals.filter((v) => v >= 36).length / group.length) * 100).toFixed(1) + "%");
  const passRate = (((totals.filter((v) => v >= 30).length / group.length) * 100).toFixed(1) + "%");
  const lowRate = (((totals.filter((v) => v < 20).length / group.length) * 100).toFixed(1) + "%");
  const fullScoreCount = totals.filter((v) => v === 40).length;

  const avgLong = (
    group.map((s) => parseFloat(s.longContrib || "0") || 0).reduce((a, b) => a + b, 0) / group.length
  ).toFixed(1);
  const avgBall = (
    group.map((s) => parseFloat(s.ballContrib || "0") || 0).reduce((a, b) => a + b, 0) / group.length
  ).toFixed(1);
  const avgSelect = (
    group.map((s) => parseFloat(s.selectContrib || "0") || 0).reduce((a, b) => a + b, 0) / group.length
  ).toFixed(1);

  return {
    count: group.length,
    avgTotal,
    excellentRate,
    passRate,
    lowRate,
    fullScoreCount,
    avgLong,
    avgBall,
    avgSelect
  };
}
