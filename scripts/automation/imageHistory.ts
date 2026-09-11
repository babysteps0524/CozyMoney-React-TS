import fs from "node:fs";
import path from "node:path";

const HISTORY_FILE = path.join("src", "data", "image-history.json");

const HISTORY_DAYS = 5;

type ImageHistory = Record<string, string>;

function ensureDirectory(): void {
  const directory = path.dirname(HISTORY_FILE);

  fs.mkdirSync(directory, {
    recursive: true,
  });
}

function loadHistory(): ImageHistory {
  ensureDirectory();

  if (!fs.existsSync(HISTORY_FILE)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as ImageHistory;
  } catch (error) {
    console.warn(
      "[IMAGE HISTORY] 기록 파일을 읽을 수 없습니다.",
      error instanceof Error ? error.message : String(error),
    );

    return {};
  }
}

function saveHistory(history: ImageHistory): void {
  ensureDirectory();

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

function getKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateToTime(date: string): number {
  const time = new Date(`${date}T00:00:00+09:00`).getTime();

  return Number.isFinite(time) ? time : 0;
}

function cleanupHistory(history: ImageHistory, today: string): ImageHistory {
  const todayTime = dateToTime(today);

  const result: ImageHistory = {};

  for (const [url, usedDate] of Object.entries(history)) {
    const usedTime = dateToTime(usedDate);

    if (!usedTime) {
      continue;
    }

    const elapsedDays = (todayTime - usedTime) / (1000 * 60 * 60 * 24);

    if (elapsedDays >= 0 && elapsedDays < HISTORY_DAYS) {
      result[url] = usedDate;
    }
  }

  return result;
}

/**
 * 최근 5일 이내 사용된 이미지 URL 목록
 */
export function getUsedImageUrls(): Set<string> {
  const today = getKstDate();

  const history = loadHistory();

  const cleaned = cleanupHistory(history, today);

  if (JSON.stringify(history) !== JSON.stringify(cleaned)) {
    saveHistory(cleaned);
  }

  return new Set(Object.keys(cleaned));
}

/**
 * 이미지 URL이 최근 5일 이내 사용되었는지 확인
 */
export function isImageRecentlyUsed(url: string): boolean {
  return getUsedImageUrls().has(url);
}

/**
 * 사용한 이미지 URL을 기록
 */
export function recordUsedImages(urls: string[]): void {
  const today = getKstDate();

  const history = cleanupHistory(loadHistory(), today);

  for (const url of urls) {
    if (typeof url === "string" && url.trim()) {
      history[url.trim()] = today;
    }
  }

  saveHistory(history);

  console.log(`[IMAGE HISTORY] ${urls.length}개 이미지 기록`);
}

/**
 * 테스트나 관리 목적으로 기록 전체 삭제
 */
export function clearImageHistory(): void {
  if (fs.existsSync(HISTORY_FILE)) {
    fs.unlinkSync(HISTORY_FILE);
  }
}
