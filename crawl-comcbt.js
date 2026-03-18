const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baseDir = '/mnt/c/Users/aksnr/projects/baker-quiz';
const outFile = path.join(baseDir, 'data', 'comcbt-explanations.json');

// 시험 ID 매핑 (40개 시험 - 제과 20 + 제빵 20, 단 제과 4593~4611=19개, 제빵 4625~4643=19개 = 38개)
// 계획서에 cake 20개로 되어있으나 실제로는 19개 (4593~4611)
const EXAMS = [
  // 제과기능사 (cake) - 19개
  { id: 4593, category: 'cake', index: 1, label: '2007.04.01 2회' },
  { id: 4594, category: 'cake', index: 2, label: '2007.07.15 4회' },
  { id: 4595, category: 'cake', index: 3, label: '2007.09.16 5회' },
  { id: 4596, category: 'cake', index: 4, label: '2008.02.03 1회' },
  { id: 4597, category: 'cake', index: 5, label: '2008.03.30 2회' },
  { id: 4598, category: 'cake', index: 6, label: '2008.07.13 4회' },
  { id: 4599, category: 'cake', index: 7, label: '2008.10.05 5회' },
  { id: 4600, category: 'cake', index: 8, label: '2009.01.18 1회' },
  { id: 4601, category: 'cake', index: 9, label: '2009.03.29 2회' },
  { id: 4602, category: 'cake', index: 10, label: '2009.07.12 4회' },
  { id: 4603, category: 'cake', index: 11, label: '2009.09.27 5회' },
  { id: 4604, category: 'cake', index: 12, label: '2010.01.31 1회' },
  { id: 4605, category: 'cake', index: 13, label: '2010.03.28 2회' },
  { id: 4606, category: 'cake', index: 14, label: '2010.07.11 4회' },
  { id: 4607, category: 'cake', index: 15, label: '2010.10.03 5회' },
  { id: 4608, category: 'cake', index: 16, label: '2011.02.13 1회' },
  { id: 4609, category: 'cake', index: 17, label: '2011.04.17 2회' },
  { id: 4610, category: 'cake', index: 18, label: '2011.07.31 4회' },
  { id: 4611, category: 'cake', index: 19, label: '2011.10.09 5회' },
  // 제빵기능사 (bread) - 19개
  { id: 4625, category: 'bread', index: 1, label: '2007.04.01 2회' },
  { id: 4626, category: 'bread', index: 2, label: '2007.07.15 4회' },
  { id: 4627, category: 'bread', index: 3, label: '2007.09.16 5회' },
  { id: 4628, category: 'bread', index: 4, label: '2008.02.03 1회' },
  { id: 4629, category: 'bread', index: 5, label: '2008.03.30 2회' },
  { id: 4630, category: 'bread', index: 6, label: '2008.07.13 4회' },
  { id: 4631, category: 'bread', index: 7, label: '2008.10.05 5회' },
  { id: 4632, category: 'bread', index: 8, label: '2009.01.18 1회' },
  { id: 4633, category: 'bread', index: 9, label: '2009.03.29 2회' },
  { id: 4634, category: 'bread', index: 10, label: '2009.07.12 4회' },
  { id: 4635, category: 'bread', index: 11, label: '2009.09.27 5회' },
  { id: 4636, category: 'bread', index: 12, label: '2010.01.31 1회' },
  { id: 4637, category: 'bread', index: 13, label: '2010.03.28 2회' },
  { id: 4638, category: 'bread', index: 14, label: '2010.07.11 4회' },
  { id: 4639, category: 'bread', index: 15, label: '2010.10.03 5회' },
  { id: 4640, category: 'bread', index: 16, label: '2011.02.13 1회' },
  { id: 4641, category: 'bread', index: 17, label: '2011.04.17 2회' },
  { id: 4642, category: 'bread', index: 18, label: '2011.07.31 4회' },
  { id: 4643, category: 'bread', index: 19, label: '2011.10.09 5회' },
];

function fetchPage(url) {
  try {
    const result = execSync(
      `curl -sL -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml" -H "Accept-Language: ko-KR,ko;q=0.9" "${url}"`,
      { encoding: 'utf8', timeout: 15000 }
    );
    return result;
  } catch (e) {
    throw new Error(`curl failed: ${e.message}`);
  }
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`);
}

function parseQuestion(html) {
  let questionText = '';
  let options = [];
  let answer = -1;
  let explanation = '';

  // 문제 텍스트: <h2> 태그 내용
  const h2Match = html.match(/<h2>([^<]+)<\/h2>/);
  if (h2Match) {
    questionText = h2Match[1].trim();
  }

  // 보기 추출: "가. </td><td valign='top'>TEXT</td>" 패턴
  const optPattern = /[가나다라]\.\s*<\/td><td[^>]*>([^<]*(?:<[^>]+>[^<]*)*?)<\/td>/g;
  let optMatch;
  while ((optMatch = optPattern.exec(html)) !== null) {
    const text = optMatch[1].replace(/<[^>]+>/g, '').trim();
    options.push(text);
  }

  // 정답 추출: <div id='jungdabcolorN' ...>NUMBER</div>
  const answerMatch = html.match(/id='jungdabcolor\d+'[^>]*>(\d+)<\/div>/);
  if (answerMatch) {
    answer = parseInt(answerMatch[1]) - 1; // 1-based → 0-based
  }

  // 해설 추출: &lt;문제 해설&gt; 또는 <문제 해설> 이후 텍스트
  // 패턴: "문제 해설" 뒤 ~ "[해설작성자" 앞
  const expMatch = html.match(/(?:&lt;|<)문제\s*해설(?:&gt;|>)\s*(?:<br\s*\/?>)?\s*([\s\S]*?)(?:\[해설작성자|$)/i);
  if (expMatch) {
    explanation = expMatch[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return { q: questionText, o: options, a: answer, e: explanation };
}

function crawlExam(exam) {
  const questions = [];
  console.log(`\n크롤링: ${exam.category}[${exam.index}] (ID: ${exam.id}) - ${exam.label}`);

  for (let qNum = 1; qNum <= 60; qNum++) {
    const url = `https://www.comcbt.com/cbt/problem/${exam.id}/${qNum}/`;
    try {
      const html = fetchPage(url);
      const parsed = parseQuestion(html);
      questions.push({ num: qNum, ...parsed });

      if (qNum % 10 === 0) {
        process.stdout.write(`  ${qNum}/60`);
      }
    } catch (err) {
      console.error(`  ERROR q${qNum}: ${err.message}`);
      questions.push({ num: qNum, q: '', o: [], a: -1, e: '', error: err.message });
    }

    sleep(500);
  }

  const withExp = questions.filter(q => q.e).length;
  const withAns = questions.filter(q => q.a >= 0).length;
  console.log(`  완료 (해설: ${withExp}/60, 정답: ${withAns}/60)`);
  return { id: exam.id, category: exam.category, index: exam.index, label: exam.label, questions };
}

function main() {
  console.log(`총 ${EXAMS.length}개 시험 크롤링 시작`);
  console.log(`예상 소요 시간: ~${Math.ceil(EXAMS.length * 60 * 0.5 / 60)}분\n`);

  // 이전 결과 이어하기
  let results = [];
  const doneIds = new Set();

  if (fs.existsSync(outFile)) {
    try {
      results = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      for (const r of results) doneIds.add(r.id);
      console.log(`이전 결과 ${results.length}개 시험 로드, 나머지 이어서 크롤링\n`);
    } catch (e) {
      results = [];
    }
  }

  for (const exam of EXAMS) {
    if (doneIds.has(exam.id)) continue;

    const result = crawlExam(exam);
    results.push(result);

    // 매 시험마다 중간 저장
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');
  }

  // 최종 통계
  let totalQ = 0, withExp = 0, withAns = 0;
  for (const exam of results) {
    for (const q of exam.questions) {
      totalQ++;
      if (q.e) withExp++;
      if (q.a >= 0) withAns++;
    }
  }

  console.log('\n=== 크롤링 완료 ===');
  console.log(`시험: ${results.length}개`);
  console.log(`문제: ${totalQ}개`);
  console.log(`해설 있음: ${withExp}/${totalQ} (${(withExp/totalQ*100).toFixed(1)}%)`);
  console.log(`정답 있음: ${withAns}/${totalQ} (${(withAns/totalQ*100).toFixed(1)}%)`);
  console.log(`저장: ${outFile}`);
}

main();
