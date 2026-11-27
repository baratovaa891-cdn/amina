// 공통: id로 요소 찾기
const $ = (id) => document.getElementById(id);

// 공통: 결과 영역에 글 표시 (isError가 true면 빨간색)
function showMessage(box, message, isError = false) {
  box.classList.toggle("error", isError);
  box.style.whiteSpace = "pre-line";
  box.textContent = message;
}

// ===== 1. 글자 수 계산기 =====
function updateCounter() {
  const text = $("counter-text").value;
  const exclude = $("counter-exclude").checked;
  const target = exclude ? text.replace(/\s/g, "") : text;
  const count = Array.from(target).length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const limit = Number($("counter-limit").value);

  let message = `글자 수(${exclude ? "공백 제외" : "공백 포함"}): ${count}자\n단어 수: ${words}개`;
  if (limit > 0) {
    message += count <= limit
      ? `\n목표까지 ${limit - count}자 남음`
      : `\n목표보다 ${count - limit}자 초과`;
  }
  showMessage($("counter-result"), message);
}

$("counter-text").addEventListener("input", updateCounter);
$("counter-exclude").addEventListener("change", updateCounter);
$("counter-limit").addEventListener("change", updateCounter);
$("counter-run").addEventListener("click", updateCounter);
$("counter-reset").addEventListener("click", () => {
  $("counter-text").value = "";
  $("counter-exclude").checked = false;
  $("counter-limit").value = "0";
  updateCounter();
});

// ===== 2. D-day 계산기 =====
// 한국 시간 기준 오늘 날짜 (시간은 버리고 날짜만 사용)
function getKoreaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return Date.UTC(get("year"), get("month") - 1, get("day"));
}

function updateDday() {
  const value = $("dday-date").value; // "YYYY-MM-DD"
  if (!value) {
    return showMessage($("dday-result"), "날짜를 선택하세요.", true);
  }

  const [year, month, day] = value.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  const diff = Math.round((target - getKoreaToday()) / 86400000);

  let label = "D-Day";
  if (diff > 0) {
    label = `D-${diff}`;
  } else if (diff < 0) {
    const extra = $("dday-include-today").checked ? 1 : 0;
    label = `D+${-diff + extra}`;
  }

  const name = $("dday-name").value.trim();
  showMessage($("dday-result"), name ? `${name}\n${label}` : label);
  $("dday-result").classList.add("big");
}

$("dday-date").addEventListener("change", updateDday);
$("dday-include-today").addEventListener("change", () => {
  if ($("dday-date").value) updateDday();
});
$("dday-name").addEventListener("input", () => {
  if ($("dday-date").value) updateDday();
});
$("dday-run").addEventListener("click", updateDday);
$("dday-reset").addEventListener("click", () => {
  $("dday-name").value = "";
  $("dday-date").value = "";
  $("dday-include-today").checked = false;
  showMessage($("dday-result"), "D-?");
  $("dday-result").classList.add("big");
});

// ===== 3. 랜덤 순서 정하기 =====
// 한 줄에 한 명씩 읽고 빈 줄은 제외
function readNames(textarea) {
  return textarea.value
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name !== "");
}

function makeOrder() {
  const names = readNames($("order-names"));
  const box = $("order-result");

  if (names.length === 0) {
    return showMessage(box, "이름을 한 명 이상 입력하세요.", true);
  }

  const shuffled = shuffle(names);
  if ($("order-mode-one").checked) {
    return showMessage(box, `뽑힌 사람: ${shuffled[0]}`);
  }

  showMessage(box, "");
  box.style.whiteSpace = "normal";
  const list = document.createElement("ol");
  for (const name of shuffled) {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  }
  box.append(list);
}

$("order-run").addEventListener("click", makeOrder);
$("order-reset").addEventListener("click", () => {
  $("order-names").value = "";
  showMessage($("order-result"), "결과가 여기에 표시됩니다.");
});

// ===== 4. 팀 구성하기 =====
const teamNames = document.getElementById("team-names");
const teamBySize = document.getElementById("team-by-size");
const teamNumber = document.getElementById("team-number");
const teamLeader = document.getElementById("team-leader");
const teamRun = document.getElementById("team-run");
const teamResult = document.getElementById("team-result");

// 배열을 무작위로 섞기 (Fisher-Yates)
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showTeamError(message) {
  teamResult.classList.add("error");
  teamResult.textContent = message;
}

function makeTeams() {
  const names = readNames(teamNames);
  const number = Number(teamNumber.value);

  // 입력값 검사
  if (names.length < 2) {
    return showTeamError("학생 이름을 2명 이상 입력하세요.");
  }

  const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
  if (duplicates.length > 0) {
    const list = [...new Set(duplicates)].join(", ");
    return showTeamError(`중복된 이름이 있습니다: ${list}`);
  }

  if (!Number.isInteger(number) || number < 1) {
    return showTeamError("1 이상의 정수를 입력하세요.");
  }

  if (number > names.length) {
    return showTeamError(`학생 수(${names.length}명)보다 큰 숫자는 입력할 수 없습니다.`);
  }

  // 팀 수 정하기 (팀당 인원 기준이면 입력한 인원을 넘지 않게)
  const teamCount = teamBySize.checked
    ? Math.ceil(names.length / number)
    : number;

  // 섞은 뒤 한 명씩 돌아가며 배정하면 인원 차이는 최대 1명
  const teams = Array.from({ length: teamCount }, () => []);
  shuffle(names).forEach((name, i) => {
    teams[i % teamCount].push(name);
  });

  // 결과 표시
  teamResult.classList.remove("error");
  teamResult.style.whiteSpace = "normal";
  teamResult.textContent = "";

  teams.forEach((members, i) => {
    const box = document.createElement("div");
    box.className = "team";

    const title = document.createElement("strong");
    title.textContent = `${i + 1}팀 (${members.length}명)`;

    const list = document.createElement("ul");
    const leaderIndex = Math.floor(Math.random() * members.length);

    members.forEach((name, j) => {
      const item = document.createElement("li");
      const isLeader = teamLeader.checked && j === leaderIndex;
      item.textContent = isLeader ? `${name} (팀장)` : name;
      list.appendChild(item);
    });

    box.append(title, list);
    teamResult.appendChild(box);
  });
}

teamRun.addEventListener("click", makeTeams);

// ===== 5. 발표 시간 계산기 =====
const speechScript = document.getElementById("speech-script");
const speechSpeed = document.getElementById("speech-speed");
const speechLimit = document.getElementById("speech-limit");
const speechRun = document.getElementById("speech-run");
const speechResult = document.getElementById("speech-result");

// 1분에 읽는 글자 수
const CHARS_PER_MINUTE = { slow: 250, normal: 300, fast: 350 };

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${seconds}초`;
}

function updateSpeechTime() {
  // 공백, 줄바꿈, 탭을 제외한 글자 수
  const count = Array.from(speechScript.value.replace(/\s/g, "")).length;
  const speed = CHARS_PER_MINUTE[speechSpeed.value];
  const seconds = Math.round((count / speed) * 60);

  let message = `예상 발표 시간: ${formatTime(seconds)}\n공백 제외 ${count}자`;

  // 제한 시간과 비교
  const limit = Math.round(Number(speechLimit.value) * 60);
  if (count > 0 && limit > 0) {
    const diff = limit - seconds;
    message += diff >= 0
      ? `\n제한 시간까지 ${formatTime(diff)} 여유`
      : `\n제한 시간 ${formatTime(-diff)} 초과`;
  }

  speechResult.style.whiteSpace = "pre-line";
  speechResult.textContent = message;
}

speechScript.addEventListener("input", updateSpeechTime);
speechSpeed.addEventListener("change", updateSpeechTime);
speechLimit.addEventListener("input", updateSpeechTime);
speechRun.addEventListener("click", updateSpeechTime);

// ===== 6. 스톱워치 =====
let timerId = null; // 실행 중이 아니면 null
let startedAt = 0;
let savedTime = 0; // 정지 전까지 쌓인 시간(ms)
let laps = [];

function getElapsed() {
  return timerId === null ? savedTime : savedTime + (Date.now() - startedAt);
}

function formatClock(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function drawTime() {
  $("stopwatch-display").textContent = formatClock(getElapsed());
}

function drawLaps() {
  const box = $("stopwatch-result");
  box.hidden = !$("stopwatch-show-laps").checked;
  const text = laps.length
    ? laps.map((time, i) => `랩 ${i + 1}: ${time}`).join("\n")
    : "랩 기록이 없습니다.";
  showMessage(box, text);
}

function stopTimer() {
  if (timerId === null) return;
  savedTime = getElapsed();
  clearInterval(timerId);
  timerId = null;
  drawTime();
}

$("stopwatch-start").addEventListener("click", () => {
  if (timerId !== null) return; // 중복 실행 방지
  startedAt = Date.now();
  timerId = setInterval(drawTime, 200);
});
$("stopwatch-stop").addEventListener("click", stopTimer);
$("stopwatch-reset").addEventListener("click", () => {
  stopTimer();
  savedTime = 0;
  laps = [];
  drawTime();
  drawLaps();
});
$("stopwatch-lap").addEventListener("click", () => {
  if (timerId === null) return; // 실행 중일 때만 기록
  laps.push(formatClock(getElapsed()));
  drawLaps();
});
$("stopwatch-show-laps").addEventListener("change", drawLaps);

// ===== 7. BMI 계산기 =====
function getCategory(bmi, isWho) {
  // [정상 끝, 전단계 끝, 1단계 끝, 2단계 끝]
  const [normal, pre, first, second] = isWho ? [25, 30, 35, 40] : [23, 25, 30, 35];

  if (bmi < 18.5) {
    return "저체중";
  } else if (bmi < normal) {
    return "정상";
  } else if (bmi < pre) {
    return "비만 전단계";
  } else if (bmi < first) {
    return "1단계 비만";
  } else if (bmi < second) {
    return "2단계 비만";
  } else {
    return "3단계 비만";
  }
}

function calculateBmi() {
  const height = Number($("bmi-height").value);
  const weight = Number($("bmi-weight").value);
  const box = $("bmi-result");

  if (!(height >= 50 && height <= 250)) {
    return showMessage(box, "키를 50~250cm 사이로 입력하세요.", true);
  }
  if (!(weight >= 10 && weight <= 300)) {
    return showMessage(box, "체중을 10~300kg 사이로 입력하세요.", true);
  }

  const meters = height / 100;
  const bmi = Number((weight / (meters * meters)).toFixed(1));
  const category = getCategory(bmi, $("bmi-standard-who").checked);
  showMessage(box, `BMI: ${bmi.toFixed(1)}\n분류: ${category}`);
}

$("bmi-run").addEventListener("click", calculateBmi);
for (const id of ["bmi-standard-kr", "bmi-standard-who"]) {
  $(id).addEventListener("change", () => {
    if ($("bmi-height").value && $("bmi-weight").value) calculateBmi();
  });
}

// ===== 8. 준비물 체크리스트 =====
const checklist = $("checklist-items");
const presets = {
  class: ["학생증", "노트북", "필기도구"],
  exam: ["학생증", "컴퓨터용 사인펜", "수정테이프"],
  trip: ["세면도구", "충전기", "여벌 옷"],
};
const savedLists = {}; // 상황별 목록 보관
let currentCategory = $("checklist-category").value;

function updateCount() {
  const total = checklist.children.length;
  const done = checklist.querySelectorAll("li.done").length;
  showMessage($("checklist-result"), `전체 ${total}개 · 완료 ${done}개`);
}

function createItem(name) {
  const item = document.createElement("li");
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  const text = document.createElement("span");
  const removeButton = document.createElement("button");

  label.className = "choice";
  checkbox.type = "checkbox";
  text.textContent = name;
  removeButton.type = "button";
  removeButton.textContent = "삭제";
  removeButton.setAttribute("aria-label", `${name} 삭제`);

  checkbox.addEventListener("change", () => {
    item.classList.toggle("done", checkbox.checked);
    updateCount();
  });
  removeButton.addEventListener("click", () => {
    item.remove();
    updateCount();
  });

  label.append(checkbox, text);
  item.append(label, removeButton);
  return item;
}

function addItem() {
  const input = $("checklist-input");
  const name = input.value.trim();
  if (!name) {
    return showMessage($("checklist-result"), "준비물 이름을 입력하세요.", true);
  }
  checklist.append(createItem(name));
  input.value = "";
  input.focus();
  updateCount();
}

$("checklist-add").addEventListener("click", addItem);
$("checklist-input").addEventListener("keydown", (event) => {
  // 한글 입력 중 Enter가 두 번 처리되는 것을 방지
  if (event.key === "Enter" && !event.isComposing) addItem();
});
$("checklist-category").addEventListener("change", (event) => {
  savedLists[currentCategory] = [...checklist.children];
  currentCategory = event.target.value;
  checklist.replaceChildren(
    ...(savedLists[currentCategory] || presets[currentCategory].map(createItem))
  );
  updateCount();
});
$("checklist-reset").addEventListener("click", () => {
  for (const item of checklist.children) {
    item.classList.remove("done");
    item.querySelector("input").checked = false;
  }
  updateCount();
});

// 처음 화면
checklist.append(...presets[currentCategory].map(createItem));
updateCount();